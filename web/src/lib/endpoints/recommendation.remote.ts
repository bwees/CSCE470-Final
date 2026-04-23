import { query } from '$app/server';
import { getDB } from '$lib/server/db';
import { schema } from '$lib/server/db/schema';
import { fetchRecommendations } from '$lib/server/recommendations';
import { getUser } from '$lib/server/utils';
import type { TMDBMovie } from '$lib/types';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';

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

  return fetchRecommendations(watchlistMovies);
});
