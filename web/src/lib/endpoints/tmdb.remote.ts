import { query } from '$app/server';
import { tmdbFetch } from '$lib/server/tmdb';
import type { TMDBMovie, TMDBMovieDetails } from '$lib/types';
import * as v from 'valibot';

export const getPopularMovies = query(async () => {
  const r = await tmdbFetch('https://api.themoviedb.org/3/movie/popular');

  if (!r.ok) {
    console.error(`Failed to fetch popular movies: ${r.status} ${r.statusText}`);
    return [];
  }

  return (await r.json()).results as Array<TMDBMovie>;
});

export const searchMovies = query(v.string(), async (query: string) => {
  const r = await tmdbFetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`,
  );

  if (!r.ok) {
    console.error(`Failed to search movies: ${r.status} ${r.statusText}`);
    return [];
  }

  return (await r.json()).results as Array<TMDBMovie>;
});

export const getMovieDetails = query(v.number(), async (id: number) => {
  const r = await tmdbFetch(`https://api.themoviedb.org/3/movie/${id}`);

  if (!r.ok) {
    console.error(`Failed to fetch movie details for ID ${id}: ${r.status} ${r.statusText}`);
    return null;
  }

  return (await r.json()) as TMDBMovieDetails;
});
