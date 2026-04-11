# Web: SvelteKit + Cloudflare D1 + Drizzle

This app is configured for:

- Cloudflare Workers (`@sveltejs/adapter-cloudflare`)
- D1 database binding (`DB`)
- Drizzle ORM + Drizzle Kit migrations

## Install

```sh
pnpm install
```

## Configure D1

Create the database:

```sh
pnpm wrangler d1 create csce470-web-db
```

Copy the returned `database_id` into [wrangler.toml](wrangler.toml) under `[[d1_databases]]`.

## Drizzle Files

- Config: [drizzle.config.ts](drizzle.config.ts)
- Schema: [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts)
- Runtime DB helper: [src/lib/server/db/index.ts](src/lib/server/db/index.ts)
- SQL migrations: [migrations](migrations)

## Migration Workflow

1. Update schema in [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts)
2. Generate SQL migration:

```sh
pnpm db:generate
```

3. Apply locally:

```sh
pnpm db:migrate:local
```

4. Apply remotely:

```sh
pnpm db:migrate:remote
```

## Useful Scripts

- `pnpm dev`: Vite dev server
- `pnpm preview`: build + `wrangler dev`
- `pnpm deploy`: build + `wrangler deploy`
- `pnpm cf:types`: regenerate Cloudflare Worker types
- `pnpm db:generate`: generate SQL migrations from Drizzle schema
- `pnpm db:migrate:local`: apply migrations to local D1
- `pnpm db:migrate:remote`: apply migrations to remote D1
- `pnpm db:movies:populate:local`: fetch allowlisted movies from TMDB and upsert into local D1 at 25 requests/sec
- `pnpm db:movies:populate:remote`: fetch allowlisted movies from TMDB and upsert into remote D1 at 25 requests/sec

## Movie Metadata Backfill

1. Ensure `TMDB_API_READ_KEY` is available in your shell.
2. Apply the latest migration.
3. Run one of:

```sh
pnpm db:movies:populate:local
pnpm db:movies:populate:remote
```
