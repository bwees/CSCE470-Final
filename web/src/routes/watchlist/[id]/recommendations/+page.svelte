<script lang="ts">
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { getWatchlistById } from '$lib/endpoints/watchlists.remote';
  import { Heading, LoadingSpinner, Text } from '@immich/ui';

  type WatchlistMovie = {
    movieId: number;
    title: string;
    overview: string;
    releaseDate: string;
    posterUrl: string | null;
  };

  let { params } = $props();

  const watchlistId = $derived(Number.parseInt(params.id, 10));
  const isValidWatchlistId = $derived(Number.isInteger(watchlistId) && watchlistId > 0);
  const watchlistQuery = $derived(isValidWatchlistId ? getWatchlistById(watchlistId) : undefined);
  const movies = $derived((watchlistQuery?.current?.movies ?? []) as Array<WatchlistMovie>);

  function formatReleaseDate(releaseDate: string) {
    const date = new Date(releaseDate);
    if (Number.isNaN(date.getTime())) {
      return releaseDate;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

{#if !isValidWatchlistId}
  <Heading size="medium" class="mb-3">Invalid watchlist id</Heading>
  <Text color="muted">Open a valid watchlist from the sidebar to view its movies.</Text>
{:else if watchlistQuery?.error}
  <Heading size="medium" class="mb-3">Watchlist</Heading>
  <p class="text-red-500">Failed to load watchlist: {watchlistQuery.error.message}</p>
{:else if watchlistQuery?.loading}
  <LoadingSpinner />
{:else if !watchlistQuery?.current}
  <Heading size="medium" class="mb-3">Watchlist not found</Heading>
  <Text color="muted">This watchlist may not exist or may belong to another user.</Text>
{:else}
  <Heading size="medium" class="mb-2">Recommended Movies</Heading>

  {#if movies.length === 0}
    <Text color="muted">This watchlist is empty. Add movies from your rated list.</Text>
  {:else}
    <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {#each movies as movie}
        <MoviePoster
          movie={{
            id: movie.movieId,
            title: movie.title,
            release_date: movie.releaseDate,
            poster_path: movie.posterUrl,
          }}
        />
      {/each}
    </div>
  {/if}
{/if}
