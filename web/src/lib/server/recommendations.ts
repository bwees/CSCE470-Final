import type { TMDBMovie } from '$lib/types';
import { inArray } from 'drizzle-orm';
import { getDB } from './db';
import { schema } from './db/schema';

export type RatedMovie = { movieId: number; rating: number };
type MovieRatingResult = { movieId: number; score: number };

export async function fetchRecommendations(ratedMovies: RatedMovie[]): Promise<TMDBMovie[]> {
  if (ratedMovies.length === 0) return [];

  const response = await fetch('https://csce470.bwees.io/recommend?top_n=16', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ratedMovies),
  });
  const recommendations = (await response.json()) as MovieRatingResult[];

  if (recommendations.length === 0) return [];

  const db = getDB();
  const tmdbIds = recommendations.map((rec) => rec.movieId);
  const details = await db
    .select()
    .from(schema.movies)
    .where(inArray(schema.movies.movieId, tmdbIds));
  const detailsById = new Map(details.map((m) => [m.movieId, m]));

  return recommendations.flatMap((rec) => {
    const movie = detailsById.get(rec.movieId);
    // Model output may include TMDB ids we don't have local metadata for; drop them.
    if (!movie) return [];
    return [
      {
        id: movie.movieId,
        title: movie.title,
        release_date: movie.releaseDate,
        poster_path: movie.posterUrl,
      },
    ];
  });
}
