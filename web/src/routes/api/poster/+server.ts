import { getPosterCache } from '$lib/server/cache';
import { tmdbFetch } from '$lib/server/tmdb';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const DEFAULT_POSTER_SIZE = 'w500';
const POSTER_CACHE_HEADER = 'public, max-age=31536000, immutable';

export async function GET({ url }: { url: URL }) {
  const tmdbId = url.searchParams.get('tmdbId');

  if (!tmdbId) {
    return new Response('Missing tmdbId query parameter', { status: 400 });
  }

  const size = url.searchParams.get('size') ?? DEFAULT_POSTER_SIZE;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const edgeCache = getPosterCache();
  const cachedResponse = await edgeCache.match(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const detailsResponse = await tmdbFetch(`https://api.themoviedb.org/3/movie/${tmdbId}`);

  if (!detailsResponse.ok) {
    console.log(
      `Failed to fetch TMDB movie details for ID ${tmdbId}: ${detailsResponse.status} ${detailsResponse.statusText}`,
    );
    return new Response('Unable to load TMDB movie details', { status: detailsResponse.status });
  }

  const movie = (await detailsResponse.json()) as { poster_path?: string | null };

  if (!movie.poster_path) {
    return new Response('Poster not found for TMDB movie', { status: 404 });
  }

  const posterResponse = await fetch(`${TMDB_IMAGE_BASE_URL}/${size}${movie.poster_path}`);

  if (!posterResponse.ok) {
    return new Response('Unable to load TMDB poster image', { status: posterResponse.status });
  }

  const headers = new Headers();
  const contentType = posterResponse.headers.get('content-type');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  headers.set('Cache-Control', POSTER_CACHE_HEADER);

  const response = new Response(posterResponse.body, {
    status: posterResponse.status,
    headers,
  });

  await edgeCache.put(cacheKey, response.clone());

  return response;
}
