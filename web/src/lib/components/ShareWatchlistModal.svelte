<script lang="ts">
  import { goto } from '$app/navigation';
  import { createSharedList } from '$lib/endpoints/sharing.remote';
  import type { ModalProps } from '$lib/types';
  import { Button, Heading, Modal, ModalBody, Stack, toastManager } from '@immich/ui';
  import { mdiShareVariant } from '@mdi/js';

  interface Props extends ModalProps {
    watchlistId: number;
    shareCode: string;
  }

  let { onClose, watchlistId, shareCode }: Props = $props();

  let codes = $state<[string, string, string]>(['', '', '']);
  let saving = $state(false);

  function setCode(index: number, value: string) {
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);
    codes[index] = cleaned;
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(shareCode);
      toastManager.success('Code copied!');
    } catch {
      toastManager.danger('Could not copy code');
    }
  }

  async function save() {
    const entered = codes.map((c) => c.trim()).filter((c) => c.length > 0);
    if (entered.length === 0) {
      toastManager.danger('Enter at least one share code');
      return;
    }
    if (entered.some((c) => c.length !== 4)) {
      toastManager.danger('Share codes must be 4 characters');
      return;
    }
    if (entered.some((c) => c === shareCode)) {
      toastManager.danger("You can't add your own list's code");
      return;
    }

    saving = true;
    try {
      const result = await createSharedList({
        baseWatchlistId: watchlistId,
        codes: entered,
      });
      toastManager.success('Shared list created!');
      onClose();
      goto(`/shared/${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create shared list';
      toastManager.danger(message);
    } finally {
      saving = false;
    }
  }
</script>

<Modal title="Share Watchlist" icon={mdiShareVariant} {onClose} size="medium">
  <ModalBody>
    <Stack class="gap-6">
      <Stack class="gap-2">
        <Heading size="small">Your share code</Heading>
        <div class="flex items-center gap-3">
          <code
            class="rounded-lg bg-gray-800 px-4 py-3 font-mono text-2xl tracking-widest text-primary"
            >{shareCode}</code
          >
          <Button variant="outline" size="small" onclick={copyCode}>Copy</Button>
        </div>
      </Stack>

      <hr class="border-gray-700" />

      <Stack class="gap-2">
        <Heading size="small">Combine with friends</Heading>
        <div class="mt-2 grid gap-3">
          {#each codes as _code, i}
            <input
              type="text"
              value={codes[i]}
              oninput={(e) => setCode(i, (e.currentTarget as HTMLInputElement).value)}
              placeholder={`Code ${i + 1}`}
              maxlength={4}
              class="w-full rounded-xl border border-gray-600 bg-gray-800 px-4 py-3 text-center font-mono text-xl tracking-widest uppercase ring-primary outline-none focus:ring-2"
            />
          {/each}
        </div>
      </Stack>

      <div class="flex justify-end gap-2">
        <Button variant="ghost" color="secondary" onclick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button color="primary" onclick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Stack>
  </ModalBody>
</Modal>
