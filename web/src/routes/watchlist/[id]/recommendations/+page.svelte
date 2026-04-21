<script lang="ts">
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { getRecommendations } from '$lib/endpoints/recommendation.remote.js';
  import { Heading, LoadingSpinner, Text } from '@immich/ui';

  let { params } = $props();

  const watchlistQuery = $derived(getRecommendations(Number.parseInt(params.id)));
  const movies = $derived(watchlistQuery?.current ?? []);
</script>

{#if watchlistQuery?.error}
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
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            poster_path: movie.poster_path,
          }}
        />
      {/each}
    </div>
  {/if}
{/if}
