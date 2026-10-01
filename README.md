# Movie Explorer

A movie browser built with Next.js (App Router), the TMDB API, and Supabase. Browse
trending, popular, and top-rated films, search and filter the full catalogue, and keep a
personal watchlist with watched and favourite tracking.

Stack: Next.js 16 · React 19 · TypeScript (strict) · Tailwind CSS v4 · Supabase · TMDB API

---

## Features

- Home page with trending this week, popular, and top-rated poster grids
- Search with URL-driven pagination
- Browse by genre, release year, and sort order
- Movie detail pages with cast, trailer, and similar titles
- Email/password sign-up and login, with sessions kept fresh by `proxy.ts`
- Personal watchlist with *Want to watch* / *Watched* / *Favorites* tabs
- Add, mark watched, favourite, and remove actions on every poster card

---

## 1. Get a TMDB key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/).
2. Go to **Account → Settings → API** and request an API key. Approval is usually instant.
3. On the same page you will see an **API Read Access Token** — a long string that starts
   with `eyJ…`.

That read access token is what this app uses. It goes in `TMDB_READ_TOKEN` and is **server
only**. Do not put `NEXT_PUBLIC_` in front of that variable name: Next.js inlines anything
with that prefix into the JavaScript sent to the browser, which would publish your token to
every visitor.

---

## 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. Wait for the database to finish provisioning.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`anon`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The publishable key is designed to be public. It is safe in the browser *because* Row Level
Security decides what it can read. This project never uses the service-role or secret key.

---

## 3. Run the database schema

1. In the Supabase dashboard go to **SQL Editor → New query**.
2. Open [`supabase/schema.sql`](./supabase/schema.sql) in this repo, paste it in, and run it.
3. Confirm it worked under **Database → Tables**: you should see a `watchlist` table, and
   under **Database → Tables → watchlist → RLS** the policies should show
   `Users can manage their own watchlist`.

The script is safe to re-run — every statement is guarded.

The policy is the whole security model. It allows a signed-in user to read, insert, update,
and delete rows only where `auth.uid() = user_id`, so one account can never see or modify
another account's list.

---

## 4. Turn off email confirmation (development only)

By default Supabase emails a confirmation link before an account becomes usable, which makes
local testing slow and hides real errors.

Go to **Authentication → Sign In / Providers → Email** and turn **Confirm email** off.

Leave this on in production. With it off, anyone can create an account under any email
address.

---

## 5. Run it locally

```bash
npm install
```

Create `.env.local` in the project root (it is already in `.gitignore`):

```bash
TMDB_READ_TOKEN=your_tmdb_v4_read_access_token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
```

Then:

```bash
npm run dev
```

Open <http://localhost:3000>.

Check it with:

```bash
npm run build
npm run lint
```

---

## 6. Deploy to Vercel

1. Push the project to GitHub and import it at [vercel.com/new](https://vercel.com/new).
   Vercel detects Next.js on its own — leave every build setting at its default.
2. Open **Project → Settings → Environment Variables** and add all three:

   | Name | Environment |
   |---|---|
   | `TMDB_READ_TOKEN` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |

3. Redeploy. Environment variables are read at build time, so an existing deployment does
   not pick up new ones — use **Deployments → ⋯ → Redeploy**.
4. Back in Supabase, go to **Authentication → URL Configuration** and set:
   - **Site URL** — your Vercel domain, e.g. `https://movie-explorer.vercel.app`
   - **Redirect URLs** — add the same domain with `/**` appended, e.g.
     `https://movie-explorer.vercel.app/**`, plus `http://localhost:3000/**` for local work.

   Without this, Supabase will refuse the redirect after a successful sign-in.

---

## Project structure

```
app/
  page.tsx              Home: trending, popular, top rated
  search/page.tsx       Search results, paginated via ?q= and ?page=
  browse/page.tsx       Discover filters: ?genre= ?year= ?sort= ?page=
  movie/[id]/page.tsx   Detail: cast, trailer, similar
  watchlist/page.tsx    Tabs via ?tab=want_to_watch|watched|favorites
  login/ signup/        Auth forms (Client Components)
  layout.tsx            Header, search box, account controls, TMDB footer
  loading.tsx           Skeletons
  error.tsx             Error boundary with retry
  not-found.tsx         404
components/
  MovieCard.tsx         Poster + title + watchlist buttons
  MovieGrid.tsx         Responsive grid
  WatchlistButtons.tsx  Add / watched / favourite / remove (Client Component)
  Pagination.tsx        Previous / next preserving query params
  AuthNav.tsx           Logged-in state and log-out action
lib/
  tmdb.ts               Typed TMDB fetch wrapper (server-only)
  supabase/client.ts    Browser Supabase client
  supabase/server.ts    Server Supabase client, reads session cookies
  watchlist/queries.ts  Watchlist reads
  watchlist/actions.ts  Watchlist Server Actions
proxy.ts                Refreshes the session and guards /watchlist
supabase/schema.sql     Table, index, and RLS policy
```

---

## A few things worth knowing

**The TMDB token never reaches the browser.** All TMDB access goes through `lib/tmdb.ts`,
which imports `server-only`. If a Client Component ever imports it, the build fails rather
than silently shipping the token.

**`proxy.ts` is Next 16's renamed `middleware.ts`.** It refreshes the Supabase session on
every request and redirects signed-out visitors away from `/watchlist`.

**The TMDB logo is still missing.** `app/layout.tsx` has a marked `TODO` placeholder in the
footer. Drop the official logo into `public/` and uncomment the line. The attribution line
must stay.

**Pages are rendered per visitor.** Because every poster card shows watchlist state, the home,
search, browse, and detail pages are dynamic. TMDB responses are still cached for an hour, so
this costs rendering time rather than API quota.
