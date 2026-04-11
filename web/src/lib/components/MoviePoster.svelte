<script lang="ts">
  import type { TMDBMovie } from '$lib/types';
  import { Icon, modalManager } from '@immich/ui';
  import { mdiCheckBold } from '@mdi/js';
  import MovieModal from './MovieModal.svelte';

  type Props = {
    movie: TMDBMovie;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: (movieId: number) => void;
  };

  let { movie, selectable = false, selected = false, onSelect }: Props = $props();

  function handleClick() {
    if (selectable) {
      onSelect?.(movie.id);
      return;
    }

    modalManager.show(MovieModal, { movie });
  }
</script>

<button
  class="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg bg-gray-800 p-4 text-left"
  class:ring-2={selected}
  class:ring-primary={selected}
  onclick={handleClick}
>
  {#if selectable && selected}
    <span class="absolute top-2 right-2 rounded-full bg-primary p-1 text-white">
      <Icon icon={mdiCheckBold} size="1em" />
    </span>
  {/if}
  <img src={`/api/poster?tmdbId=${movie.id}`} alt="Movie Poster" />
  <h2 class="text-center text-lg font-semibold">{movie.title}</h2>
  <p class="text-sm text-gray-600">Release Date: {movie.release_date}</p>
</button>
