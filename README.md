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
- Email/password sign-up with a username, and login by **either** username or email
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
   - **Secret key** (`service_role`) → `SUPABASE_SERVICE_ROLE_KEY`

The publishable key is designed to be public. It is safe in the browser *because* Row Level
Security decides what it can read.

The secret key is **not** public — it bypasses Row Level Security entirely, so anyone holding
it can read and write every table. This project uses it in exactly one module,
`lib/supabase/admin.ts`, for the two questions the anon key is correctly forbidden to answer:
is this username taken, and which account owns this username. Never prefix it with
`NEXT_PUBLIC_`, and never import it from a Client Component.

---

## 3. Run the database schema

There are two scripts. Run them in this order, both from **SQL Editor → New query**.

### `supabase/schema.sql`

1. Open [`supabase/schema.sql`](./supabase/schema.sql) in this repo, paste it in, and run it.
2. Confirm it worked under **Database → Tables**: you should see a `watchlist` table, and
   under **Database → Tables → watchlist → RLS** the policies should show
   `Users can manage their own watchlist`.

The script is safe to re-run — every statement is guarded.

The policy is the whole security model. It allows a signed-in user to read, insert, update,
and delete rows only where `auth.uid() = user_id`, so one account can never see or modify
another account's list.

### `supabase/username.sql`

1. Open [`supabase/username.sql`](./supabase/username.sql), paste it in, and run it.
2. Confirm you now see a `profiles` table with an `on_auth_user_created` trigger under
   **Database → Tables → profiles → Triggers**.

This adds the `profiles` table, a `handle_new_user` trigger that fills it in automatically
whenever an account is created, and a unique index on `lower(username)` so `Alice` and
`alice` cannot both be claimed.

Run it **before** creating any accounts. Sign-up stores the username through that trigger, so
an account created without it fails with a database error. The file ends with a commented-out
backfill for accounts that already exist; it is left commented out on purpose, because it
writes a placeholder name your users did not choose.

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
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
```

The last three are all in **Project Settings → API** in the Supabase dashboard.

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
2. Open **Project → Settings → Environment Variables** and add all four:

   | Name | Environment |
   |---|---|
   | `TMDB_READ_TOKEN` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |

   None of them carry a `NEXT_PUBLIC_` prefix except the two that are meant to be public.

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
  login/                Log in by username or email (Server Component + form)
  signup/               Create an account and claim a username
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
  auth/actions.ts       Sign-up and log-in Server Actions
  supabase/admin.ts     Service-role client, usernames only (server-only)
  supabase/client.ts    Browser Supabase client (currently unused)
  supabase/server.ts    Server Supabase client, reads session cookies
  watchlist/queries.ts  Watchlist reads
  watchlist/actions.ts  Watchlist Server Actions
proxy.ts                Refreshes the session and guards /watchlist
supabase/schema.sql     Watchlist table, index, and RLS policy
supabase/username.sql   Profiles table, trigger, and username rules
```

---

## A few things worth knowing

**The TMDB token never reaches the browser.** All TMDB access goes through `lib/tmdb.ts`,
which imports `server-only`. If a Client Component ever imports it, the build fails rather
than silently shipping the token.

**The service-role key never reaches the browser either.** It lives only in
`lib/supabase/admin.ts`, which also imports `server-only`, and only Server Actions call it.
Logging in by username has to happen on the server for this reason: turning a username into
an email is exactly the lookup the anon key must not be able to do, so there is no way to do
it without handing the browser a username-to-email map.

**A wrong username and a wrong password get the same error.** "Invalid login credentials."
covers both, plus unconfirmed and disabled accounts, so the login form cannot be used to find
out which usernames exist.

**Usernames are created by a database trigger, not by the form.** `supabase/username.sql`
installs `handle_new_user`, which reads the username out of the sign-up metadata and inserts
a profile row. That is why the availability check in the sign-up action is only a courtesy:
the unique index on `lower(username)` is what actually decides, and a name that slips through
fails the whole registration rather than creating a half-made account.

**`proxy.ts` is Next 16's renamed `middleware.ts`.** It refreshes the Supabase session on
every request and redirects signed-out visitors away from `/watchlist`.

**The TMDB logo is still missing.** `app/layout.tsx` has a marked `TODO` placeholder in the
footer. Drop the official logo into `public/` and uncomment the line. The attribution line
must stay.

**Pages are rendered per visitor.** Because every poster card shows watchlist state, the home,
search, browse, and detail pages are dynamic. TMDB responses are still cached for an hour, so
this costs rendering time rather than API quota.
