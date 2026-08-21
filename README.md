# CalendarApp

A calendar app for planning tasks per day, per person. The UI is in Swedish; the
code and comments are in English.

## Architecture

| Part         | Stack                                    |
| ------------ | ----------------------------------------- |
| `frontend/`  | React 19, Ant Design, Vite, React Router |

All data goes straight from the browser to Supabase (PostgreSQL) via
`@supabase/supabase-js`, which also handles auth. State is synced to the
`app_state` table keyed by `user_id`, with `localStorage` as a synchronous cache
(see `frontend/src/store.ts`).

There is no backend server — the frontend is built as static files and
deployed to Azure Static Web Apps via GitHub Actions
(`.github/workflows/azure-static-web-apps-happy-hill-0f4378d10.yml`).

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- Yarn
- A Supabase project

## Setup

### 1. Frontend configuration

```bash
cd frontend
cp .env.example .env.local
```

Fill in your values from **Supabase → Project Settings → API Keys**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

`.env.local` is gitignored. The anon (publishable) key is not a secret — it is
embedded in the client bundle by design, so **security depends entirely on Row
Level Security** in Supabase. See [Security](#security).

### 2. Install frontend dependencies

```bash
yarn --cwd frontend install
```

## Running

```bash
yarn dev
```

## Building

```bash
yarn --cwd frontend build              # tsc -b && vite build
```

## Security

- **No secrets in the repo.** The only configuration is the frontend's
  gitignored `.env.local`, and the key it holds is public by design.
- **Row Level Security is required.** The anon key is public, so every table the
  frontend touches must have RLS enabled with a policy scoped to the current
  user. For `app_state`:

  ```sql
  alter table app_state enable row level security;

  create policy "own data" on app_state
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  ```

  Verify with:

  ```sql
  select tablename, rowsecurity from pg_tables where schemaname = 'public';
  select tablename, policyname from pg_policies where schemaname = 'public';
  ```
