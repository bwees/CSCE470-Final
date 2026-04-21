import { query } from '$app/server';
import { getDB } from '$lib/server/db';
import { schema } from '$lib/server/db/schema';
import { getUser } from '$lib/server/utils';
import type { TMDBMovie } from '$lib/types';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

type MovieRatingResult = {
  movieId: number;
  score: number;
};

export const getRecommendations = query(v.number(), async (watchlistId): Promise<TMDBMovie[]> => {
  const db = getDB();
  const user = getUser();

  if (!user) {
    return [];
  }

  // Watchlist/ratings are keyed by TMDB id; the server does the TMDB → MovieLens → matrix idx
  // translation internally, and returns TMDB ids back.
  const watchlistMovies = await db
    .select({
      movieId: schema.watchlistMovies.movieId,
      rating: schema.userMovieRatings.rating,
    })
    .from(schema.watchlistMovies)
    .where(
      and(eq(schema.watchlistMovies.watchlistId, watchlistId), eq(schema.watchlists.userId, user)),
    )
    .innerJoin(schema.watchlists, eq(schema.watchlists.id, schema.watchlistMovies.watchlistId))
    .innerJoin(
      schema.userMovieRatings,
      and(
        eq(schema.userMovieRatings.movieId, schema.watchlistMovies.movieId),
        eq(schema.userMovieRatings.userId, user),
      ),
    );

  if (watchlistMovies.length === 0) {
    return [];
  }

  const response = await fetch('http://localhost:8000/recommend?top_n=16', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(watchlistMovies),
  });
  const raw: unknown = await response.json();
  const recommendations: MovieRatingResult[] = Array.isArray(raw)
    ? (raw as MovieRatingResult[])
    : [];

  if (recommendations.length === 0) {
    return [];
  }

  // The model's output set may include TMDB ids we don't have metadata for locally;
  // drop those rather than returning null entries.
  const tmdbIds = recommendations.map((rec) => rec.movieId);
  const details = await db
    .select()
    .from(schema.movies)
    .where(inArray(schema.movies.movieId, tmdbIds));
  const detailsById = new Map(details.map((m) => [m.movieId, m]));

  return recommendations.flatMap((rec) => {
    const movie = detailsById.get(rec.movieId);
    if (!movie) {
      console.log(`No metadata for recommended movie with TMDB id ${rec.movieId}; skipping`);
      return [];
    }
    return [
      {
        id: movie.movieId,
        title: movie.title,
        release_date: movie.releaseDate,
        poster_path: movie.posterUrl,
      },
    ];
  });
});
