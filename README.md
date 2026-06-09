# Эйфория

Handmade Next.js app with email-code authentication.

## Environment Variables

Use the same names locally, in GitHub Environment `EUPHORIA`, and in Vercel Project Settings -> Environment Variables.

Client-safe:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Server-only:

```env
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
SESSION_COOKIE_NAME=euphoria_session
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client.
- `RESEND_API_KEY` must never be exposed to the client.
- Server secrets must not start with `NEXT_PUBLIC`.
- `EMAIL_FROM` is used as the sender for login-code emails.

## Supabase SQL

Run this in the Supabase SQL editor:

```sql
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_codes_email_created_at
on login_codes(email, created_at desc);

create index if not exists idx_sessions_token_hash
on sessions(token_hash);

create index if not exists idx_sessions_user_id
on sessions(user_id);
```

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

If you do not create `.env.example`, put the variables from the Environment Variables section directly in `.env.local`.

## Test Checklist

- Enter an email.
- Receive a login code by email.
- Enter the code.
- Land in the dashboard.
- Refresh the page and remain authenticated.
- Click `выйти` and return to the main screen.
