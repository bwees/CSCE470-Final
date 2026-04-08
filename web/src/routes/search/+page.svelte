<script lang="ts">
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { searchMovies } from '$lib/endpoints/tmdb.remote';
  import { LoadingSpinner } from '@immich/ui';
  import { onMount } from 'svelte';

  let query = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);
  let shownQuery = $state('');

  let movies = $derived(shownQuery != '' ? searchMovies(shownQuery) : undefined);

  onMount(() => {
    searchInput?.focus();
  });

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    shownQuery = query.trim();
  }
</script>

<form class="mx-auto mb-8 max-w-2xl" onsubmit={submitSearch}>
  <label for="search-query" class="mb-2 block text-sm font-semibold text-gray-300">Search</label>
  <input
    id="search-query"
    name="search"
    type="text"
    bind:this={searchInput}
    bind:value={query}
    placeholder="Type a movie title and press Enter"
    class="w-full rounded-full border border-gray-300 px-4 py-3 text-base ring-primary outline-none focus:ring-2"
    autocomplete="off"
  />
</form>

{#if movies?.error}
  <p class="text-red-500">Failed to load popular movies: {movies.error.message}</p>
{:else if movies?.loading}
  <LoadingSpinner />
{:else if movies?.current?.length === 0}
  <p>No popular movies found.</p>
{/if}

<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {#each movies?.current ?? [] as movie}
    <MoviePoster {movie} />
  {/each}
</div>
