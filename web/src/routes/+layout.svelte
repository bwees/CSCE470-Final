<script lang="ts">
  import { goto } from '$app/navigation';
  import favicon from '$lib/assets/favicon.svg';
  import {
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Heading,
    Icon,
    IconButton,
    NavbarItem,
    Stack,
    TooltipProvider,
  } from '@immich/ui';
  import { mdiListBox, mdiMagnify, mdiMovieRoll, mdiPlus, mdiStarBox } from '@mdi/js';
  import { onMount } from 'svelte';
  import '../app.css';

  let open = $state(true);

  const items = [
    {
      icon: mdiPlus,
      title: 'Create Watchlist',
      href: '/watchlist/new',
      class: 'text-primary',
      active: false,
    },
  ];

  let { children } = $props();

  onMount(() => {
    // create random uuid and create cookie to identify user for watchlist
    if (!document.cookie.split('; ').find((row) => row.startsWith('userIdFF='))) {
      const userId = crypto.randomUUID();
      document.cookie = `userIdFF=${userId}; path=/; max-age=31536000`; // Expires in 1 year
    }
  });
</script>

<svelte:head>
  <link rel="pnicon" href={favicon} />
</svelte:head>

<TooltipProvider>
  <div class="border">
    <AppShell>
      <AppShellHeader>
        <div class="flex w-full items-center justify-between gap-4 p-4 text-primary">
          <div class="flex items-center gap-2">
            <Icon icon={mdiMovieRoll} size="1.5em" />
            <Heading size="medium">FilmFinder</Heading>
          </div>

          <IconButton
            icon={mdiMagnify}
            aria-label="Search"
            variant="ghost"
            color="secondary"
            onclick={() => goto('/search')}
          ></IconButton>
        </div>
      </AppShellHeader>

      <AppShellSidebar class="pt-2" bind:open>
        <Stack class="pe-4">
          <NavbarItem icon={mdiStarBox} title="Popular" href="/popular" />
          <NavbarItem icon={mdiListBox} title="My Watchlists" href="/watchlist" expanded {items} />
        </Stack>
      </AppShellSidebar>

      <div class="p-4">
        {@render children()}
      </div>
    </AppShell>
  </div>
</TooltipProvider>
