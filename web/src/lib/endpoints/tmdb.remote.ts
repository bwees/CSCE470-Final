import { query } from '$app/server';
import { ALLOWED_TMDB_IDS } from '$lib/server/allowed-tmdb-ids';
import { tmdbFetch } from '$lib/server/tmdb';
import type { TMDBMovie, TMDBMovieDetails } from '$lib/types';
import * as v from 'valibot';

const ALLOWED_TMDB_ID_SET = new Set<number>(ALLOWED_TMDB_IDS);

function filterAllowedMovies(movies: Array<TMDBMovie>) {
  return movies.filter((movie) => ALLOWED_TMDB_ID_SET.has(movie.id));
}

async function fetchPopularPage(page: number): Promise<Array<TMDBMovie>> {
  const r = await tmdbFetch(`https://api.themoviedb.org/3/movie/popular?page=${page}`);

  if (!r.ok) {
    console.error(`Failed to fetch popular movies page ${page}: ${r.status} ${r.statusText}`);
    return [];
  }

  return (await r.json()).results as Array<TMDBMovie>;
}

export const getPopularMovies = query(async () => {
  const pages = Array.from({ length: 10 }, (_, index) => index + 1);
  const pageResults = await Promise.all(pages.map((page) => fetchPopularPage(page)));
  const mergedMovies = pageResults.flat();

  return filterAllowedMovies(mergedMovies);
});

export const searchMovies = query(v.string(), async (query: string) => {
  const r = await tmdbFetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`,
  );

  if (!r.ok) {
    console.error(`Failed to search movies: ${r.status} ${r.statusText}`);
    return [];
  }

  return filterAllowedMovies((await r.json()).results as Array<TMDBMovie>);
});

export const getMovieDetails = query(v.number(), async (id: number) => {
  const r = await tmdbFetch(`https://api.themoviedb.org/3/movie/${id}`);

  if (!r.ok) {
    console.error(`Failed to fetch movie details for ID ${id}: ${r.status} ${r.statusText}`);
    return null;
  }

  return (await r.json()) as TMDBMovieDetails;
});
