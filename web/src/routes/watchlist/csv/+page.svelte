<script lang="ts">
  import { goto } from '$app/navigation';
  import { createWatchlistFromMovieLens } from '$lib/endpoints/watchlists.remote';
  import { Button, Heading, toastManager } from '@immich/ui';
  import Papa from 'papaparse';

  let watchlistTitle = $state('');
  let csvText = $state('');
  let isSubmitting = $state(false);

  type ParsedRating = { movieLensId: number; rating: number };

  function parseCsv(text: string): ParsedRating[] {
    const csv = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const rows: ParsedRating[] = [];
    for (const line of csv.data) {
      const movieLensId = Number.parseInt(line['movieid'], 10);
      const rating = Number.parseFloat(line['rating']);
      if (Number.isNaN(movieLensId) || Number.isNaN(rating)) {
        continue;
      }
      rows.push({ movieLensId, rating });
    }
    return rows;
  }

  let parsed = $derived(parseCsv(csvText));

  async function submit() {
    const trimmedTitle = watchlistTitle.trim();
    if (!trimmedTitle || parsed.length === 0) {
      return;
    }

    isSubmitting = true;
    try {
      const result = await createWatchlistFromMovieLens({
        name: trimmedTitle,
        ratings: parsed,
      });
      toastManager.success(`Created watchlist with ${result.insertedMovies} movie(s).`);
      goto(`/watchlist/${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create watchlist';
      toastManager.danger(message);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="mb-6 flex flex-row items-center justify-between">
    <Heading size="medium">Import Watchlist from CSV</Heading>
    <Button
      disabled={isSubmitting || parsed.length === 0 || !watchlistTitle.trim()}
      onclick={submit}
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
      placeholder="Imported from CSV"
      class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base ring-primary outline-none focus:ring-2"
      maxlength="100"
    />
  </div>

  <div>
    <label for="csv-data" class="mb-2 block text-sm font-semibold text-gray-300">
      Paste CSV (expects columns: userId, movieId, rating, ...)
    </label>
    <textarea
      id="csv-data"
      bind:value={csvText}
      placeholder={'userId,movieId,rating,timestamp,title,genres\n25,8644,3.5,1641309285,"I, Robot (2004)",Action|Adventure|Sci-Fi|Thriller'}
      rows="14"
      class="w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm ring-primary outline-none focus:ring-2"
    ></textarea>
  </div>
</div>
