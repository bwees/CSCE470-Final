<script lang="ts">
  import { goto } from '$app/navigation';
  import { createWatchlistFromMovieLens } from '$lib/endpoints/watchlists.remote';
  import { Button, Heading, Text, toastManager } from '@immich/ui';

  let watchlistTitle = $state('');
  let csvText = $state('');
  let isSubmitting = $state(false);

  type ParsedRating = { movieLensId: number; rating: number };
  type ParseResult = { rows: ParsedRating[]; errors: number };

  function splitCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }

  function parseCsv(text: string): ParseResult {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { rows: [], errors: 0 };
    }

    const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const hasHeader = header.includes('movieid') && header.includes('rating');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const movieIdIdx = hasHeader ? header.indexOf('movieid') : 1;
    const ratingIdx = hasHeader ? header.indexOf('rating') : 2;

    const rows: ParsedRating[] = [];
    let errors = 0;
    for (const line of dataLines) {
      const fields = splitCsvLine(line);
      const movieLensId = Number(fields[movieIdIdx]);
      const rating = Number(fields[ratingIdx]);
      if (!Number.isFinite(movieLensId) || !Number.isFinite(rating)) {
        errors += 1;
        continue;
      }
      rows.push({ movieLensId, rating });
    }
    return { rows, errors };
  }

  let parsed = $derived(parseCsv(csvText));

  async function submit() {
    const trimmedTitle = watchlistTitle.trim();
    if (!trimmedTitle || parsed.rows.length === 0) {
      return;
    }

    isSubmitting = true;
    try {
      const result = await createWatchlistFromMovieLens({
        name: trimmedTitle,
        ratings: parsed.rows,
      });
      toastManager.success(
        `Created watchlist with ${result.insertedMovies} movie(s). ` +
          `${result.unmapped + result.missing} row(s) skipped (not in catalog).`,
      );
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
      disabled={isSubmitting || parsed.rows.length === 0 || !watchlistTitle.trim()}
      onclick={submit}
    >
      {isSubmitting ? 'Creating...' : 'Create'}
    </Button>
  </div>

  <div>
    <label for="watchlist-title" class="mb-2 block text-sm font-semibold text-gray-300">Title</label>
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
    <div class="mt-2">
      <Text size="small" color="muted">
        Parsed {parsed.rows.length} row(s){parsed.errors > 0
          ? ` • ${parsed.errors} skipped (bad format)`
          : ''}. Rows whose movies aren't in the catalog will be skipped server-side.
      </Text>
    </div>
  </div>
</div>
