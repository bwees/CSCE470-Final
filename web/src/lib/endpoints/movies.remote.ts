import { query } from '$app/server';
import { tmdbFetch } from '$lib/server/tmdb';

export const getPopularMovies = query(async () => {
  const r = await tmdbFetch('https://api.themoviedb.org/3/movie/popular');

  if (!r.ok) {
    console.error(`Failed to fetch popular movies: ${r.status} ${r.statusText}`);
    return [];
  }

  return (await r.json()).results as Array<{
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
  }>;
});
