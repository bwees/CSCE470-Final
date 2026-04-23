<script lang="ts">
  import { goto } from '$app/navigation';
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { deleteSharedList, getSharedListById } from '$lib/endpoints/sharing.remote';
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

  let { params } = $props();

  const sharedId = $derived(params.id);
  const sharedQuery = $derived(getSharedListById(Number.parseInt(params.id)));
  const movies = $derived(sharedQuery?.current?.movies ?? []);

  async function handleDelete() {
    const confirm = await modalManager.show(ConfirmModal, {
      title: 'Delete Shared List',
      prompt: 'Are you sure you want to delete this shared list? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'danger',
      icon: mdiTrashCan,
    });

    if (!confirm) {
      return;
    }

    try {
      await deleteSharedList(Number.parseInt(params.id));
      toastManager.success('Shared list deleted!');
      goto('/watchlist');
    } catch (error) {
      toastManager.danger('Failed to delete shared list');
    }
  }
</script>

{#if sharedQuery?.error}
  <Heading size="medium" class="mb-3">Shared List</Heading>
  <p class="text-red-500">Failed to load shared list: {sharedQuery.error.message}</p>
{:else if sharedQuery?.loading}
  <LoadingSpinner />
{:else if !sharedQuery?.current}
  <Heading size="medium" class="mb-3">Shared list not found</Heading>
  <Text color="muted">This shared list may not exist or may belong to another user.</Text>
{:else}
  <HStack class="items-start justify-between">
    <div>
      <Heading size="medium" class="mb-2">{sharedQuery.current.name}</Heading>
      <Text size="small" color="muted" class="mb-6 block">
        {movies.length}
        {movies.length === 1 ? 'movie' : 'movies'} combined
      </Text>
    </div>

    <div class="flex flex-row items-center gap-2">
      <Button variant="outline" size="small" href={`/shared/${sharedId}/recommendations`}>
        View Recommendations
      </Button>
      <IconButton
        variant="outline"
        color="danger"
        icon={mdiTrashCan}
        aria-label="Delete shared list"
        onclick={handleDelete}
      />
    </div>
  </HStack>

  {#if movies.length === 0}
    <Text color="muted">
      No rated movies in this shared list yet. Make sure every member has rated movies in their
      watchlist.
    </Text>
  {:else}
    <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {#each movies as movie}
        <div class="space-y-2">
          <MoviePoster
            movie={{
              id: movie.movieId,
              title: movie.title,
              release_date: movie.releaseDate,
              poster_path: movie.posterUrl,
            }}
          />
          <Text size="small" color="muted" class="text-center">
            {#if movie.ratingCount > 1}
              Avg rating: {(movie.averageRating ?? 0).toFixed(1)}/5 ({movie.ratingCount} raters)
            {:else if movie.ratingCount === 1 && movie.averageRating !== null}
              Rating: {movie.averageRating.toFixed(1)}/5
            {/if}
          </Text>
        </div>
      {/each}
    </div>
  {/if}
{/if}
