import { query } from '$app/server';
import { getDB } from '$lib/server/db';
import { schema } from '$lib/server/db/schema';
import type { TMDBMovie, TMDBMovieDetails } from '$lib/types';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import * as v from 'valibot';

function toTMDBMovie(movie: {
  movieId: number;
  title: string;
  releaseDate: string;
  posterUrl: string | null;
}): TMDBMovie {
  return {
    id: movie.movieId,
    title: movie.title,
    release_date: movie.releaseDate,
    poster_path: movie.posterUrl,
  };
}

export const getPopularMovies = query(async () => {
  const db = getDB();
  const movies = await db
    .select()
    .from(schema.movies)
    .orderBy(desc(schema.movies.releaseDate))
    .limit(200);

  return movies.map(toTMDBMovie);
});

export const searchMovies = query(v.string(), async (query: string) => {
  const db = getDB();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const movies = await db
    .select()
    .from(schema.movies)
    .where(sql`lower(${schema.movies.title}) like ${`%${normalizedQuery}%`}`)
    .orderBy(desc(schema.movies.releaseDate))
    .limit(100);

  return movies.map(toTMDBMovie);
});

export const getMoviesByIds = query(v.array(v.number()), async (movieIds: Array<number>) => {
  const uniqueMovieIds = [...new Set(movieIds)].filter((id) => Number.isInteger(id));
  if (uniqueMovieIds.length === 0) {
    return [];
  }

  const db = getDB();
  const movies = await db
    .select()
    .from(schema.movies)
    .where(inArray(schema.movies.movieId, uniqueMovieIds));

  return movies.map(toTMDBMovie);
});

export const getMovieDetails = query(v.number(), async (id: number) => {
  const db = getDB();
  const rows = await db.select().from(schema.movies).where(eq(schema.movies.movieId, id)).limit(1);
  const movie = rows[0];

  if (!movie) {
    return null;
  }

  return {
    id: movie.movieId,
    title: movie.title,
    overview: movie.overview,
    release_date: movie.releaseDate,
    poster_path: movie.posterUrl,
  } as TMDBMovieDetails;
});
