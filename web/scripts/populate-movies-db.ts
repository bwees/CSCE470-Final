import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ALLOWED_TMDB_IDS } from '../src/lib/server/allowed-tmdb-ids';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webRoot = join(__dirname, '..');
const DATABASE_NAME = 'csce470-web-db';
const BATCH_SIZE = 25;
const RATE_WINDOW_MS = 1000;

type TMDBMovieResponse = {
  id: number;
  title?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
};

type MovieRow = {
  movieId: number;
  title: string;
  overview: string;
  releaseDate: string;
  posterUrl: string | null;
};

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMovie(tmdbId: number): Promise<MovieRow | null> {
  const apiKey = process.env.TMDB_API_READ_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_READ_KEY is not set');
  }

  const response = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.warn(`Skipping TMDB movie ${tmdbId} due to ${response.status} ${response.statusText}`);
    return null;
  }

  const movie = (await response.json()) as TMDBMovieResponse;

  return {
    movieId: movie.id,
    title: movie.title?.trim() ?? '',
    overview: movie.overview ?? '',
    releaseDate: movie.release_date ?? '',
    posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
  };
}

function toUpsertSql(movies: Array<MovieRow>): string {
  const statements = movies.map((movie) => {
    const title = escapeSqlString(movie.title);
    const overview = escapeSqlString(movie.overview);
    const releaseDate = escapeSqlString(movie.releaseDate);
    const posterUrl = movie.posterUrl === null ? 'NULL' : `'${escapeSqlString(movie.posterUrl)}'`;

    return `INSERT INTO movies (movie_id, title, overview, release_date, poster_url)
VALUES (${movie.movieId}, '${title}', '${overview}', '${releaseDate}', ${posterUrl})
ON CONFLICT(movie_id) DO UPDATE SET
  title=excluded.title,
  overview=excluded.overview,
  release_date=excluded.release_date,
  poster_url=excluded.poster_url;`;
  });

  return ['BEGIN TRANSACTION;', ...statements, 'COMMIT;'].join('\n');
}

async function writeAndApplySql(sql: string, remote: boolean): Promise<void> {
  const sqlFilePath = join(webRoot, 'scripts', 'populate-movies.sql');

  await writeFile(sqlFilePath, sql, 'utf8');

  const args = ['wrangler', 'd1', 'execute', DATABASE_NAME, '--file', sqlFilePath];
  args.push(remote ? '--remote' : '--local');
  await execFileAsync('pnpm', args, { cwd: webRoot });
}

async function main(): Promise<void> {
  const remote = process.argv.includes('--remote');
  const movies: Array<MovieRow> = [];

  for (let start = 0; start < ALLOWED_TMDB_IDS.length; start += BATCH_SIZE) {
    const batchStart = Date.now();
    const batch = ALLOWED_TMDB_IDS.slice(start, start + BATCH_SIZE);
    const fetched = await Promise.all(batch.map((tmdbId) => fetchMovie(tmdbId)));

    for (const movie of fetched) {
      if (movie) {
        movies.push(movie);
      }
    }

    const elapsed = Date.now() - batchStart;
    if (elapsed < RATE_WINDOW_MS && start + BATCH_SIZE < ALLOWED_TMDB_IDS.length) {
      await sleep(RATE_WINDOW_MS - elapsed);
    }

    console.log(
      `Fetched ${Math.min(start + BATCH_SIZE, ALLOWED_TMDB_IDS.length)} / ${ALLOWED_TMDB_IDS.length}`,
    );
  }

  if (movies.length === 0) {
    throw new Error('No movie metadata fetched from TMDB. Nothing to write to D1.');
  }

  const sql = toUpsertSql(movies);
  await writeAndApplySql(sql, remote);

  console.log(
    `Upserted ${movies.length} movies into D1 (${remote ? 'remote' : 'local'}) with rate limit ${BATCH_SIZE} req/sec.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
