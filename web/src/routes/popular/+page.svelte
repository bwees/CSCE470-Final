<script lang="ts">
  import { getPopularMovies } from '$lib/endpoints/movies.remote';
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
    <div class="flex flex-col items-center gap-2 rounded-lg bg-gray-800 p-4">
      <img src={`/api/poster?tmdbId=${movie.id}`} alt="Movie Poster" />
      <h2 class="text-center text-lg font-semibold">{movie.title}</h2>
      <p class="text-sm text-gray-600">Release Date: {movie.release_date}</p>
    </div>
  {/each}
</div>
