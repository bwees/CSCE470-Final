<script lang="ts">
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { getPopularMovies } from '$lib/endpoints/tmdb.remote';
  import { Heading, LoadingSpinner } from '@immich/ui';

  const movies = getPopularMovies();
</script>

<Heading size="medium" class="mb-4">Popular Movies</Heading>

{#if movies.error}
  <p class="text-red-500">Failed to load popular movies: {movies.error.message}</p>
{:else if movies.loading}
  <LoadingSpinner />
{:else if movies.current?.length === 0}
  <p>No popular movies found.</p>
{/if}

<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {#each movies.current ?? [] as movie}
    <MoviePoster {movie} />
  {/each}
</div>
