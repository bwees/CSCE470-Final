import { getPosterCache } from '$lib/server/cache';
import { getDB } from '$lib/server/db';
import { schema } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

  const db = getDB();
  const movie = await db
    .select({ posterUrl: schema.movies.posterUrl })
    .from(schema.movies)
    .where(eq(schema.movies.movieId, Number(tmdbId)))
    .limit(1);

  const posterUrl = movie[0]?.posterUrl;

  if (!posterUrl) {
    return new Response('Poster not found for movie', { status: 404 });
  }

  let resolvedPosterUrl = posterUrl;
  if (resolvedPosterUrl.includes('/w500/')) {
    resolvedPosterUrl = resolvedPosterUrl.replace('/w500/', `/${size}/`);
  }

  const posterResponse = await fetch(resolvedPosterUrl);

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
