# KalenderApp

A calendar app for planning tasks per day, per person. The UI is in Swedish; the
code and comments are in English.

## Architecture

| Part                   | Stack                                        |
| ---------------------- | -------------------------------------------- |
| `frontend/`            | React 19, Ant Design, Vite, React Router     |
| `KalenderApp.Server/`  | ASP.NET Core MVC, EF Core, Npgsql            |
| `KalenderApp.AppHost/` | .NET Aspire — orchestrates both of the above  |

Data is stored in Supabase (PostgreSQL). There are two independent paths:

- The **frontend** talks to Supabase directly via `@supabase/supabase-js`. It
  handles auth and syncs its state to the `app_state` table, keyed by `user_id`.
  `localStorage` acts as a synchronous cache (see `frontend/src/store.ts`).
- The **server** talks to the same database over EF Core / Npgsql and owns the
  `tasks` table.

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

### 2. Server configuration

The database connection string is stored in .NET user secrets, never in the
repo:

```bash
dotnet user-secrets set "ConnectionStrings:Supabase" \
  "Host=db.YOUR-PROJECT.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR-PASSWORD;SSL Mode=Require" \
  --project KalenderApp.Server
```

### 3. Install frontend dependencies

```bash
yarn --cwd frontend install
```

## Running

Via Aspire (starts both the server and the Vite dev server):

```bash
dotnet run --project KalenderApp.AppHost
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

- **No secrets in the repo.** The connection string lives in user secrets;
  frontend config lives in the gitignored `.env.local`.
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

- **The server has no authentication.** `CalendarController` is unauthenticated,
  so do not expose the server publicly as-is.
- **Migrations run on startup** (`db.Database.Migrate()` in `Program.cs`), which
  requires schema write permissions. Consider running migrations as a separate
  deploy step instead.
