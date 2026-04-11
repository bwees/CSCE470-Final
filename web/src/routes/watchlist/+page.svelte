<script lang="ts">
  import MoviePoster from '$lib/components/MoviePoster.svelte';
  import { getUserRatings } from '$lib/endpoints/ratings.remote';
  import { getUserWatchlists } from '$lib/endpoints/watchlists.remote';
  import { Heading } from '@immich/ui';

  let ratedMovies = getUserRatings();
  let watchlists = getUserWatchlists();
</script>

<Heading size="large">My Movies</Heading>
<hr class="my-4" />
<Heading size="medium">My Watchlists</Heading>
<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {#each watchlists.current ?? [] as watchlist}
    <a
      class="flex items-center gap-4 rounded-lg bg-gray-800 p-4"
      href={`/watchlist/${watchlist.id}`}
    >
      <Heading size="small">{watchlist.name}</Heading>
      <span class="rounded-full bg-gray-700 px-2 py-1 text-sm text-gray-300">
        {watchlist.movies.length}
        {watchlist.movies.length === 1 ? 'movie' : 'movies'}
      </span>
    </a>
  {/each}
</div>
<Heading size="medium" class="mt-4">Rated Movies</Heading>
<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {#each ratedMovies.current ?? [] as movie}
    <MoviePoster
      movie={{
        id: movie.movie.id,
        title: movie.movie.title,
        release_date: movie.movie.release_date,
        poster_path: movie.movie.poster_path,
      }}
    />
  {/each}
</div>
