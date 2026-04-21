import { command, query } from '$app/server';
import { getDB } from '$lib/server/db';
import { schema } from '$lib/server/db/schema';
import { ML_TO_TMDB } from '$lib/server/ml-to-tmdb';
import { getUser } from '$lib/server/utils';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

import { getUserRatings } from './ratings.remote';

const createWatchlistDto = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  movieIds: v.array(v.number()),
});

export const createWatchlist = command(createWatchlistDto, async (dto) => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const insertedWatchlist = await db
    .insert(schema.watchlists)
    .values({
      userId: user,
      name: dto.name,
    })
    .returning({
      id: schema.watchlists.id,
    });

  const watchlistId = insertedWatchlist[0]?.id;
  if (!watchlistId) {
    throw new Error('Failed to create watchlist');
  }

  const uniqueMovieIds = [...new Set(dto.movieIds)];
  if (uniqueMovieIds.length > 0) {
    await db.insert(schema.watchlistMovies).values(
      uniqueMovieIds.map((movieId) => ({
        watchlistId,
        movieId,
      })),
    );
  }

  getUserWatchlists().refresh();

  return { id: watchlistId };
});

const createWatchlistFromMovieLensDto = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  ratings: v.array(
    v.object({
      movieLensId: v.number(),
      rating: v.pipe(v.number(), v.minValue(0), v.maxValue(5)),
    }),
  ),
});

export const createWatchlistFromMovieLens = command(
  createWatchlistFromMovieLensDto,
  async (dto) => {
    const db = getDB();
    const user = getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const byTmdb = new Map<number, number>();
    let unmapped = 0;
    for (const { movieLensId, rating } of dto.ratings) {
      const tmdbId = ML_TO_TMDB[movieLensId];
      if (tmdbId === undefined) {
        unmapped += 1;
        continue;
      }
      // Last rating wins if the same movie appears twice.
      byTmdb.set(tmdbId, Math.round(rating));
    }

    let insertedMovies = 0;
    let insertedRatings = 0;
    let watchlistId: number | null = null;

    if (byTmdb.size > 0) {
      const tmdbIds = [...byTmdb.keys()];
      const existing = await db
        .select({ movieId: schema.movies.movieId })
        .from(schema.movies)
        .where(inArray(schema.movies.movieId, tmdbIds));
      const knownTmdbIds = new Set(existing.map((row) => row.movieId));

      const validPairs = tmdbIds
        .filter((id) => knownTmdbIds.has(id))
        .map((id) => ({ movieId: id, rating: byTmdb.get(id)! }));

      if (validPairs.length > 0) {
        const [inserted] = await db
          .insert(schema.watchlists)
          .values({ userId: user, name: dto.name })
          .returning({ id: schema.watchlists.id });

        if (!inserted) {
          throw new Error('Failed to create watchlist');
        }
        watchlistId = inserted.id;

        await db.insert(schema.watchlistMovies).values(
          validPairs.map(({ movieId }) => ({
            watchlistId: inserted.id,
            movieId,
          })),
        );
        insertedMovies = validPairs.length;

        for (const { movieId, rating } of validPairs) {
          await db
            .insert(schema.userMovieRatings)
            .values({ userId: user, movieId, rating })
            .onConflictDoUpdate({
              target: [schema.userMovieRatings.userId, schema.userMovieRatings.movieId],
              set: { rating },
            });
        }
        insertedRatings = validPairs.length;
      }
    }

    if (watchlistId === null) {
      throw new Error('No movies from the CSV matched the movie database.');
    }

    getUserWatchlists().refresh();
    getUserRatings().refresh();

    return {
      id: watchlistId,
      total: dto.ratings.length,
      insertedMovies,
      insertedRatings,
      unmapped,
      missing: dto.ratings.length - unmapped - insertedMovies,
    };
  },
);

export const getUserWatchlists = query(async () => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    return [];
  }

  const rows = await db
    .select({
      watchlistId: schema.watchlists.id,
      watchlistName: schema.watchlists.name,
      movieId: schema.movies.movieId,
      title: schema.movies.title,
      overview: schema.movies.overview,
      releaseDate: schema.movies.releaseDate,
      posterUrl: schema.movies.posterUrl,
    })
    .from(schema.watchlists)
    .leftJoin(schema.watchlistMovies, eq(schema.watchlistMovies.watchlistId, schema.watchlists.id))
    .leftJoin(schema.movies, eq(schema.movies.movieId, schema.watchlistMovies.movieId))
    .where(eq(schema.watchlists.userId, user));

  const byWatchlist = new Map<
    number,
    {
      id: number;
      name: string;
      movies: Array<{
        movieId: number;
        title: string;
        overview: string;
        releaseDate: string;
        posterUrl: string | null;
      }>;
    }
  >();

  for (const row of rows) {
    const existing = byWatchlist.get(row.watchlistId);
    if (!existing) {
      byWatchlist.set(row.watchlistId, {
        id: row.watchlistId,
        name: row.watchlistName,
        movies: [],
      });
    }

    if (row.movieId !== null) {
      byWatchlist.get(row.watchlistId)!.movies.push({
        movieId: row.movieId,
        title: row.title!,
        overview: row.overview!,
        releaseDate: row.releaseDate!,
        posterUrl: row.posterUrl,
      });
    }
  }

  return Array.from(byWatchlist.values());
});

export const getWatchlistById = query(v.number(), async (watchlistId: number) => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    return null;
  }

  const rows = await db
    .select({
      watchlistId: schema.watchlists.id,
      watchlistName: schema.watchlists.name,
      movieId: schema.movies.movieId,
      title: schema.movies.title,
      overview: schema.movies.overview,
      releaseDate: schema.movies.releaseDate,
      posterUrl: schema.movies.posterUrl,
    })
    .from(schema.watchlists)
    .leftJoin(schema.watchlistMovies, eq(schema.watchlistMovies.watchlistId, schema.watchlists.id))
    .leftJoin(schema.movies, eq(schema.movies.movieId, schema.watchlistMovies.movieId))
    .where(and(eq(schema.watchlists.userId, user), eq(schema.watchlists.id, watchlistId)));

  if (rows.length === 0) {
    return null;
  }

  const watchlist = {
    id: rows[0].watchlistId,
    name: rows[0].watchlistName,
    movies: [] as Array<{
      movieId: number;
      title: string;
      overview: string;
      releaseDate: string;
      posterUrl: string | null;
    }>,
  };

  for (const row of rows) {
    if (row.movieId !== null) {
      watchlist.movies.push({
        movieId: row.movieId,
        title: row.title!,
        overview: row.overview!,
        releaseDate: row.releaseDate!,
        posterUrl: row.posterUrl,
      });
    }
  }

  return watchlist;
});

export const deleteWatchlist = command(v.number(), async (watchlistId: number) => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  await db
    .delete(schema.watchlists)
    .where(and(eq(schema.watchlists.userId, user), eq(schema.watchlists.id, watchlistId)));

  getUserWatchlists().refresh();
});

export const removeMovieFromWatchlist = command(
  v.object({
    watchlistId: v.number(),
    movieId: v.number(),
  }),
  async (dto) => {
    const db = getDB();
    const user = getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    await db
      .delete(schema.watchlistMovies)
      .where(
        and(
          eq(schema.watchlistMovies.watchlistId, dto.watchlistId),
          eq(schema.watchlistMovies.movieId, dto.movieId),
          eq(schema.watchlists.userId, user),
        ),
      );
    getUserWatchlists().refresh();
  },
);

export const addMovieToWatchlist = command(
  v.object({ movie: v.number(), watchlist: v.number() }),
  async (dto) => {
    const db = getDB();
    const user = getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    await db
      .insert(schema.watchlistMovies)
      .values({
        watchlistId: Number(dto.watchlist),
        movieId: Number(dto.movie),
      })
      .onConflictDoNothing();

    getUserWatchlists().refresh();
  },
);
