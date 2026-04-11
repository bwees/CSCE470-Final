<script lang="ts">
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { getUserRatings } from '$lib/endpoints/ratings.remote';
  import { createWatchlist } from '$lib/endpoints/watchlists.remote';
  import { Button, Heading, LoadingSpinner, Text, toastManager } from '@immich/ui';

  const userRatings = getUserRatings();

  let watchlistTitle = $state('');
  let selectedMovieIds = $state<Array<number>>([]);
  let isSubmitting = $state(false);

  function toggleMovieSelection(movieId: number) {
    if (selectedMovieIds.includes(movieId)) {
      selectedMovieIds = selectedMovieIds.filter((id) => id !== movieId);
      return;
    }

    selectedMovieIds = [...selectedMovieIds, movieId];
  }

  async function submitWatchlist(event: SubmitEvent) {
    event.preventDefault();

    const trimmedTitle = watchlistTitle.trim();
    if (!trimmedTitle || selectedMovieIds.length === 0) {
      return;
    }

    isSubmitting = true;
    try {
      await createWatchlist({
        name: trimmedTitle,
        movieIds: selectedMovieIds,
      });

      toastManager.success('Watchlist created!');
      watchlistTitle = '';
      selectedMovieIds = [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create watchlist';
      toastManager.danger(message);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form class=" space-y-6" onsubmit={submitWatchlist}>
  <div class="mb-6 flex flex-row items-center justify-between">
    <Heading size="medium">Create Watchlist</Heading>
    <Button
      type="submit"
      form="watchlist-form"
      disabled={isSubmitting || selectedMovieIds.length === 0 || !watchlistTitle.trim()}
    >
      {isSubmitting ? 'Creating...' : 'Create'}
    </Button>
  </div>
  <div>
    <label for="watchlist-title" class="mb-2 block text-sm font-semibold text-gray-300">Title</label
    >
    <input
      id="watchlist-title"
      name="title"
      type="text"
      bind:value={watchlistTitle}
      placeholder="Weekend Favorites"
      class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base ring-primary outline-none focus:ring-2"
      maxlength="100"
    />
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold text-gray-300">Select Rated Movies</h2>
    {#if userRatings.error}
      <p class="text-red-500">Failed to load your ratings: {userRatings.error.message}</p>
    {:else if userRatings.loading}
      <LoadingSpinner />
    {:else if (userRatings.current?.length ?? 0) === 0}
      <p class="text-gray-400">
        You have no rated movies yet. Rate movies first, then create a watchlist.
      </p>
    {:else}
      <div class="mb-3">
        <Text size="small" color="muted">
          Click posters to select. Selected: {selectedMovieIds.length}
        </Text>
      </div>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {#each userRatings?.current ?? [] as rating}
          <div class="space-y-2">
            <MoviePoster
              movie={rating.movie}
              selectable
              selected={selectedMovieIds.includes(rating.movie.id)}
              onSelect={toggleMovieSelection}
            />
            <Text size="small" color="muted" class="text-center">
              Your rating: {rating.rating}/5
            </Text>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</form>
