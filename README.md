# Propora — Frontend

Marketing site + tenant dashboard for the Propora property-management platform.
**Frontend-only repo.** The backend contract is frozen:

- Base URL: `https://propora-nestjs-postegresql.vercel.app`
- Swagger: `https://propora-nestjs-postegresql.vercel.app/docs`
- OpenAPI JSON: `https://propora-nestjs-postegresql.vercel.app/docs-json`

Found the API misbehaving? Report back with a Swagger link + request/response paste. Never write backend code here.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 · shadcn-style UI (Radix) ·
TanStack Query + axios · React Hook Form + zod · TanStack Table · Sonner · Recharts · next-intl (EN) ·
next-themes (dark mode) · Supabase Realtime (broadcast) · Vitest · Playwright · Husky + lint-staged.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill values (see below)
npm run dev                  # http://localhost:3000
```

### Env

| Var | Purpose |
| --- | ------- |
| `NEXT_PUBLIC_API_URL` | Frozen backend base URL |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Realtime broadcast only |
| `NEXT_PUBLIC_APP_URL` | Metadata / OG only |

## Scripts

| Command | What |
| ------- | ---- |
| `npm run dev` | Dev server (Turbopack) |
| `npx tsc --noEmit` | Strict typecheck (no `any`) |
| `npm run lint` | ESLint (Next + react-compiler rules) |
| `npx vitest run` | Unit tests (28 green) |
| `npm run test:e2e` | Playwright smoke (needs `npx playwright install`) |
| `npm run build` | Production build (must stay green) |

## Conventions (see `AGENTS.md`)

- TanStack Query everywhere; axios singleton in `src/lib/api-client.ts` (in-memory token,
  single-flight 401 refresh, `BroadcastChannel` multi-tab logout).
- Every table: server search (debounced 350 ms) + server pagination + reload button.
- Every delete behind `ConfirmDialog`; every mutation toasts via Sonner.
- Forms: React Hook Form + zod, schema colocated with the form.
- Colocation: one folder per component; deep imports only, no barrel chains.
- All UI strings in `src/messages/en.json` via `useTranslations`.
- Conventional Commits, pushed to GitHub.
