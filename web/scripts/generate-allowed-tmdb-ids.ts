import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type MovieIdMapping = Record<string, number>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webRoot = join(__dirname, '..');

const mappingPath = join(
  webRoot,
  '..',
  'algorithm',
  'data',
  'movielens',
  'ml-32m',
  'movie_id_mapping.json',
);
const linksPath = join(webRoot, '..', 'algorithm', 'data', 'movielens', 'ml-32m', 'links.csv');
const outputPath = join(webRoot, 'src', 'lib', 'server', 'allowed-tmdb-ids.ts');

function parseLinksCsv(csvText: string): Map<number, number> {
  const rows = csvText.trim().split(/\r?\n/);
  const header = rows.shift();

  if (!header) {
    throw new Error('links.csv is empty');
  }

  const movieLensToTmdb = new Map<number, number>();

  for (const row of rows) {
    const [movieIdRaw, , tmdbIdRaw] = row.split(',');
    const movieLensId = Number(movieIdRaw);
    const tmdbId = Number(tmdbIdRaw);

    if (Number.isNaN(movieLensId) || Number.isNaN(tmdbId) || tmdbId <= 0) {
      continue;
    }

    movieLensToTmdb.set(movieLensId, tmdbId);
  }

  return movieLensToTmdb;
}

function buildOutput(ids: number[]): string {
  const header = [
    '// AUTO-GENERATED FILE. DO NOT EDIT.',
    '// Run: pnpm run tmdb:allowlist:generate',
    '',
  ].join('\n');

  return `${header}export const ALLOWED_TMDB_IDS = [${ids.join(',')}] as const;\n`;
}

async function main(): Promise<void> {
  const [mappingText, linksText] = await Promise.all([
    readFile(mappingPath, 'utf8'),
    readFile(linksPath, 'utf8'),
  ]);

  const mapping = JSON.parse(mappingText) as MovieIdMapping;
  const subsetMovieLensIds = Object.keys(mapping).map((id) => Number(id));
  const movieLensToTmdb = parseLinksCsv(linksText);

  const allowedTmdbIdSet = new Set<number>();

  for (const movieLensId of subsetMovieLensIds) {
    const tmdbId = movieLensToTmdb.get(movieLensId);
    if (tmdbId) {
      allowedTmdbIdSet.add(tmdbId);
    }
  }

  const allowedTmdbIds = Array.from(allowedTmdbIdSet);
  allowedTmdbIds.sort((a, b) => a - b);

  await writeFile(outputPath, buildOutput(allowedTmdbIds), 'utf8');

  console.log(`Generated ${allowedTmdbIds.length} TMDB IDs at ${outputPath}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
