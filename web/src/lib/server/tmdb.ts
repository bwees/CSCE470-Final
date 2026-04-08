import { env } from '$env/dynamic/private';

export function tmdbFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${env.TMDB_API_READ_KEY}`,
      Accept: 'application/json',
    },
  });
}
