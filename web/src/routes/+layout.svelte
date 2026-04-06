<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import {
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Heading,
    Icon,
    NavbarItem,
    Stack,
  } from '@immich/ui';
  import { mdiHeart, mdiListBox, mdiMovieRoll, mdiPlus, mdiStarBox } from '@mdi/js';
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
</script>

<svelte:head>
  <link rel="pnicon" href={favicon} />
</svelte:head>

<div class="border">
  <AppShell>
    <AppShellHeader>
      <div class="flex items-center gap-2 p-4 text-primary">
        <Icon icon={mdiMovieRoll} size="1.5em" />
        <Heading size="medium">FilmFinder</Heading>
      </div>
    </AppShellHeader>

    <AppShellSidebar class="pt-2" bind:open>
      <Stack class="pe-4">
        <NavbarItem icon={mdiStarBox} title="Popular" href="/popular" />
        <NavbarItem icon={mdiHeart} title="Favorites" href="/favorites" />
        <NavbarItem icon={mdiListBox} title="My Watchlists" href="/watchlist" expanded {items} />
      </Stack>
    </AppShellSidebar>

    <div class="p-4">
      {@render children()}
    </div>
  </AppShell>
</div>
