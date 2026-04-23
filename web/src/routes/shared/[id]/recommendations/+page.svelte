<script lang="ts">
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { getSharedRecommendations } from '$lib/endpoints/sharing.remote';
  import { Heading, LoadingSpinner, Text } from '@immich/ui';

  let { params } = $props();

  const recQuery = $derived(getSharedRecommendations(Number.parseInt(params.id)));
  const movies = $derived(recQuery?.current ?? []);
</script>

{#if recQuery?.error}
  <Heading size="medium" class="mb-3">Recommendations</Heading>
  <p class="text-red-500">Failed to load recommendations: {recQuery.error.message}</p>
{:else if recQuery?.loading}
  <LoadingSpinner />
{:else}
  <Heading size="medium" class="mb-2">Recommended Movies</Heading>
  <Text size="small" color="muted" class="mb-4 block">
    Based on averaged ratings from every member of this shared list.
  </Text>

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
