# Receta

A family cookbook. Log in, browse recipes, add your own.

## Setup

1. Create `.env.local`:
   ```
   DATABASE_URL=postgresql://user@localhost:5432/recipes
   AUTH_SECRET=<generate with `openssl rand -base64 33`>
   ```
2. Install dependencies and apply migrations:
   ```bash
   npm install
   psql $DATABASE_URL -f db/migrations/0000_mature_thunderball.sql
   # ...then each file in db/migrations/, in order
   ```
3. Create the first admin account:
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs <username> <password>
   ```
4. Run it:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in.

## Commands

```bash
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
npm test         # Vitest
```

More detail (architecture, auth, adding people) is in `CLAUDE.md`.
