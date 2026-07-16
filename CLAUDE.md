# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured yet.

## Stack

- **Next.js 16.2.6** with App Router and React Server Components
- **React 19** / **TypeScript 5**
- **Tailwind CSS v4** — configured inline in `app/globals.css` via `@theme` (no `tailwind.config.js`)
- **shadcn/ui** (radix-nova style, zinc base color) — add components via `npx shadcn add <component>`
- **lucide-react** for icons
- **tRPC v11** + **React Query v5** for type-safe client↔server calls
- **Drizzle ORM** + **PostgreSQL** (`postgres` driver)
- **NextAuth v5 (Auth.js) beta**, Credentials provider, JWT sessions — see "Auth" below

## Architecture

App Router is used exclusively — all routes live under `app/`. Path alias `@/` maps to the repo root.

| Alias | Path |
|---|---|
| `@/components` | `components/` |
| `@/ui` | `components/ui/` |
| `@/lib` | `lib/` |
| `@/hooks` | `hooks/` |

Tailwind v4 color tokens and the dark-mode palette are defined in `app/globals.css` using oklch color space. Edit colors there, not in a config file.

### tRPC — two usage patterns

**Client components** import `trpc` from `@/lib/trpc/client` and call hooks:
```ts
const createRecipe = trpc.recipe.create.useMutation(...)
```

**Server components** call `getServerCaller()` from `@/lib/trpc/server` (async — it reads the current session) and call procedures directly (no HTTP round-trip):
```ts
const serverCaller = await getServerCaller()
const recipes = await serverCaller.recipe.list()
```

The HTTP adapter lives at `app/api/trpc/[trpc]/route.ts`. Procedures live in `server/routers/recipe.ts` and `server/routers/user.ts`; the root router is `server/routers/_app.ts`. `protectedProcedure` (must be logged in) and `adminProcedure` (must be `role: "admin"`) are defined in `server/trpc.ts` alongside `publicProcedure`.

### Recipe creation data flow

User fills the form on `/new-recipe` directly → Save. The page calls `trpc.recipe.create.useMutation`, which resolves slug uniqueness and inserts the record into PostgreSQL.

### Auth

Whole site requires login (`proxy.ts` — **not** `middleware.ts`: Next.js 16 renamed the file/export from `middleware` to `proxy`, same behavior). Two roles: `admin` and `member`. Only admins can reach `/admin`.

- **Accounts are admin-created, username only.** In `/admin`, an admin adds a username + role; the row is inserted with `password_hash = NULL` ("pending setup").
- **Members claim their own account.** They go to `/login`, type their username; if no password is set yet they're prompted to create one right there (`user.claim` mutation) — no invite token, whoever knows the username can claim it once.
- **Sessions are JWT-based, 1 week** (`session.maxAge` in `auth.ts`).
- **Last-seen tracking**: `proxy.ts` does a self-throttling conditional `UPDATE users SET last_active_at = now() WHERE ... last_active_at::date < CURRENT_DATE` on every authenticated request, so it writes at most once per user per day. Shown on `/admin` as "Today" / "Yesterday" / a date / "Never".
- Auth config: `auth.ts` (repo root). Route handler: `app/api/auth/[...nextauth]/route.ts`. Role lives on the JWT/session via `callbacks.jwt`/`callbacks.session` in `auth.ts`; typed via `types/next-auth.d.ts`.

**Bootstrapping the first admin** (chicken-and-egg: the admin panel creates users, but you need to be an admin to reach it):
```bash
node --env-file=.env.local scripts/create-admin.mjs <username> <password>
```
Safe to re-run — it upserts by username and always sets `role = 'admin'`.

### Database & migrations

Schema is in `db/schema.ts`. Drizzle config points migrations to `db/migrations/`.

`drizzle-kit generate` requires an interactive TTY and will error in non-TTY shells. **The working pattern is to write migrations manually as plain SQL** and apply with:
```bash
psql $DATABASE_URL -f db/migrations/<file>.sql
```

Name new files `NNNN_<slug>.sql` following the existing sequence.

### Category constants — keep in sync

Recipe categories are defined in **two places** and must stay identical:

- `app/new-recipe/page.tsx` → `MEAL_CATEGORIES` (drives the dropdown)
- `components/recipes-browser.tsx` → `CATEGORIES` (drives the filter pills; prefixed with `"All"`)

Current values: `Meal | Dessert | Appetizer | Snack | Salad | Soup | Side | Bread | Drink`

`TAG_TO_CATEGORY` in `new-recipe/page.tsx` maps raw tags that Mistral might return (e.g. `"dinner"`, `"lunch"`) to the canonical category labels. `resolveCategory()` in `recipes-browser.tsx` does the same for display — it also covers legacy DB records that pre-date the normalised labels.
