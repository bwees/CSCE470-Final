<script lang="ts">
  import { getMovieRating, updateMovieRating } from '$lib/endpoints/ratings.remote';
  import { getMovieDetails } from '$lib/endpoints/tmdb.remote';
  import type { ModalProps, TMDBMovie } from '$lib/types';
  import {
    Button,
    Heading,
    HStack,
    Icon,
    IconButton,
    LoadingSpinner,
    Modal,
    ModalBody,
    Select,
    Stack,
    Text,
    toastManager,
  } from '@immich/ui';
  import { mdiCalendar, mdiFilmstrip, mdiStar, mdiStarOutline } from '@mdi/js';

  interface Props extends ModalProps {
    movie: TMDBMovie;
  }
  let { onClose, movie }: Props = $props();

  let details = $derived(getMovieDetails(movie.id));
  let userRating = $derived(await getMovieRating(movie.id));
  let selectedWatchlist = $state<string | undefined>(undefined);

  function setUserRating(rating: number) {
    if (userRating === rating) {
      rating = 0; // Toggle off if the same rating is clicked
    }
    updateMovieRating({
      movieId: movie.id,
      rating,
    });
  }
</script>

<Modal title={'Movie Details'} icon={mdiFilmstrip} {onClose} size="giant">
  <ModalBody>
    {#if details?.error}
      <p class="text-red-500">Failed to load movie details: {details.error.message}</p>
    {:else if details?.loading}
      <LoadingSpinner />
    {:else if details?.current}
      <!-- Movie details content goes here -->
      <HStack class="gap-8">
        <img src={`/api/poster?tmdbId=${movie.id}`} alt="Movie Poster" class="h-128 rounded-lg" />

        <Stack class="justify-between gap-8">
          <Stack>
            <Heading size="large" fontWeight="bold">
              {movie.title}
            </Heading>
            <HStack gap={2}>
              <Icon icon={mdiCalendar} size="1.25em" />
              <Text size="medium" color="muted">
                Release Date: {movie.release_date}
              </Text>
            </HStack>
            <Text>{details.current.overview}</Text>
          </Stack>

          <Stack>
            <Heading size="medium">Your Star Rating</Heading>
            <HStack gap={1}>
              {#each Array.from({ length: 5 }, (_, i) => i + 1) as star}
                <IconButton
                  type="button"
                  shape="round"
                  variant="ghost"
                  color="warning"
                  size="large"
                  aria-label={`Set rating to ${star} out of 5`}
                  onclick={() => setUserRating(star)}
                  icon={star <= (userRating ?? 0) ? mdiStar : mdiStarOutline}
                />
              {/each}
            </HStack>
          </Stack>
          <Stack>
            <Heading size="medium">Add to Watchlist</Heading>
            <Select options={['test', 'test2']} bind:value={selectedWatchlist} />
            <Button
              disabled={!selectedWatchlist || userRating === 0}
              variant="outline"
              color="primary"
              onclick={() => {
                toastManager.success('Added to watchlist!');
              }}
            >
              Add to Watchlist
            </Button>
          </Stack>
        </Stack>
      </HStack>
    {/if}
  </ModalBody>
</Modal>
