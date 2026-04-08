<script lang="ts">
  import type { TMDBMovie } from '$lib/types';
  import { modalManager } from '@immich/ui';
  import MovieModal from './MovieModal.svelte';

  let { movie }: { movie: TMDBMovie } = $props();
</script>

<button
  class="flex cursor-pointer flex-col items-center gap-2 rounded-lg bg-gray-800 p-4"
  onclick={() => modalManager.show(MovieModal, { movie })}
>
  <img src={`/api/poster?tmdbId=${movie.id}`} alt="Movie Poster" />
  <h2 class="text-center text-lg font-semibold">{movie.title}</h2>
  <p class="text-sm text-gray-600">Release Date: {movie.release_date}</p>
</button>
