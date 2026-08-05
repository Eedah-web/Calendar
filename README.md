# CalendarApp

A calendar app for planning tasks per day, per person. The UI is in Swedish; the
code and comments are in English.

## Architecture

| Part                   | Stack                                       |
| ---------------------- | ------------------------------------------- |
| `frontend/`            | React 19, Ant Design, Vite, React Router    |
| `CalendarApp.Server/`  | ASP.NET Core — static host for the frontend |
| `CalendarApp.AppHost/` | .NET Aspire — orchestrates both of the above |

All data goes straight from the browser to Supabase (PostgreSQL) via
`@supabase/supabase-js`, which also handles auth. State is synced to the
`app_state` table keyed by `user_id`, with `localStorage` as a synchronous cache
(see `frontend/src/store.ts`).

The server holds no database access, controllers or views — it only serves the
built frontend from `wwwroot`, which Aspire populates on publish. It exists so
the app can be deployed as a single container.

## Prerequisites

- .NET 10 SDK
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

The server needs no configuration — it does not talk to the database.

### 2. Install frontend dependencies

```bash
yarn --cwd frontend install
```

## Running

Via Aspire (starts both the server and the Vite dev server):

```bash
dotnet run --project CalendarApp.AppHost
```

Or the frontend alone:

```bash
yarn dev
```

## Building

```bash
yarn --cwd frontend build              # tsc -b && vite build
dotnet build                           # solution
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

- **The server exposes no endpoints of its own** beyond static files and the
  Aspire health checks, which are mapped in development only. It holds no
  credentials and reaches no database, so there is nothing to authenticate.
