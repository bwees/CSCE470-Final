<script lang="ts">
  import { goto } from '$app/navigation';
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { deleteWatchlist, getWatchlistById } from '$lib/endpoints/watchlists.remote';
  import {
    Button,
    ConfirmModal,
    Heading,
    HStack,
    IconButton,
    LoadingSpinner,
    modalManager,
    Text,
    toastManager,
  } from '@immich/ui';
  import { mdiTrashCan } from '@mdi/js';

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

  async function deleteList() {
    const confirm = await modalManager.show(ConfirmModal, {
      title: 'Delete Watchlist',
      prompt: 'Are you sure you want to delete this watchlist? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'danger',
      icon: mdiTrashCan,
    });

    if (!confirm) {
      return;
    }

    try {
      await deleteWatchlist(watchlistId);
      toastManager.success('Watchlist deleted!');
      goto('/watchlist');
    } catch (error) {
      toastManager.danger('Failed to delete watchlist');
      return;
    }
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
  <HStack class=" items-start justify-between">
    <div>
      <Heading size="medium" class="mb-2">{watchlistQuery.current.name}</Heading>
      <Text size="small" color="muted" class="mb-6 block">
        {movies.length}
        {movies.length === 1 ? 'movie' : 'movies'}
      </Text>
    </div>

    <div class="flex flex-row items-center gap-2">
      <Button variant="outline" size="small" href={`/watchlist/${watchlistId}/recommendations`}>
        View Recommendations
      </Button>
      <IconButton
        variant="outline"
        color="danger"
        icon={mdiTrashCan}
        aria-label="Delete watchlist"
        onclick={deleteList}
      />
    </div>
  </HStack>

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
