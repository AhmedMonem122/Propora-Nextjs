<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Propora Frontend — Agent Conventions

Frontend-only repo. The backend contract is **frozen**: `https://propora-nestjs-postegresql.vercel.app`
(Swagger `/docs`, OpenAPI JSON `/docs-json`). Never write backend code here; discrepancies go back
with a Swagger link + request/response paste.

## Commands

- `npm run dev` — start dev server (Turbopack)
- `npx tsc --noEmit` — typecheck (strict, no `any`)
- `npm run lint` — eslint
- `npm run build` — production build (must stay green)
- `npx vitest run` — unit tests

## Rules

- TanStack Query everywhere (no ad-hoc `fetch` in components); axios singleton in `src/lib/api-client.ts`.
- Every table: server search (debounced 350ms) + server pagination + reload button.
- Every delete behind `ConfirmDialog`; every mutation toasts success/error (Sonner).
- Forms: React Hook Form + zod (`zodResolver`), schema colocated with the form.
- Colocation: each component in its own folder (`ComponentName/ComponentName.tsx` + `schema.ts`/`*.module.css` if needed). Deep imports only, no barrel chains.
- All user-facing strings via `src/messages/en.json` through `next-intl` (`useTranslations`).
- No `dangerouslySetInnerHTML` except the static JSON-LD script on Home (explicit exception).
- Tokens live in memory only; `withCredentials: true` (httpOnly refresh cookie). No secrets in client code.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`…) and push to GitHub.
