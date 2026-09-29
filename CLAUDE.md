# DentAI

Dental clinic management system: patients, treatments, payments (bonos/abonos), appointments and pre-filled WhatsApp messages to patients. Includes an MCP server so an AI agent can operate the system, and a voice assistant in the browser.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Prisma 7 with the `prisma-client` generator and `@prisma/adapter-pg` over PostgreSQL 16
- Tailwind CSS 4 + shadcn/ui (`components/ui/` is generated, do not hand-edit)
- Auth: JWT (`jose`) stored in the `dentai-session` cookie, passwords hashed with `bcryptjs`
- Validation: Zod 4 (`lib/schemas.ts`)
- AI: Vercel AI SDK with OpenAI (`app/api/voice/route.ts`)
- MCP server: `mcp-server/` (pnpm workspace package, `@modelcontextprotocol/sdk`, stdio transport)

## Commands

```bash
pnpm install               # installs the app and the mcp-server workspace
pnpm prisma generate       # generates the client into app/generated/prisma (gitignored)
pnpm prisma migrate dev    # applies migrations to the local database
pnpm seed                  # loads demo data (prisma/seed.ts)
pnpm dev                   # http://localhost:3000
pnpm lint
pnpm build
pnpm -C mcp-server build   # compiles the MCP server
docker compose up -d       # PostgreSQL + app in dev mode
```

Required environment variables (`.env`, never committed): `DATABASE_URL`, `JWT_SECRET`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`. Optional: `OPENAI_API_KEY` (voice), `API_BASE_URL` (MCP server, defaults to `http://localhost:3000`).

## Architecture

```
app/api/**/route.ts  ->  lib/services/*.service.ts  ->  lib/repositories/*.repository.ts  ->  Prisma
```

- Route handlers only parse the request, call a service and format the response with `successResponse` / `handleApiError` (`lib/api-response.ts`). Protect them with `withAuth` (`lib/auth/middleware.ts`).
- Services hold business rules and validation and should not import Prisma directly (`dashboard.service.ts` still does, for aggregation queries).
- Repositories are the only layer that talks to Prisma (`lib/db.ts`).
- Throw the custom errors from `lib/errors.ts` (`NotFoundError`, `ValidationError`, `ConflictError`, all extending `AppError`); `handleApiError` maps them to HTTP status codes.
- Server pages call services directly; client components fetch through the hooks in `hooks/`.
- `middleware.ts` blocks every route except `/login` and `/api/auth/*` when there is no valid session.
- Money logic (debt, balance) lives in `lib/finance.ts`.

## Conventions

- Code, identifiers and commits in English; UI text in Spanish.
- Direct imports only, no barrel (`index.ts`) files.
- No `any`; use `unknown` and narrow. Validate all input with Zod schemas.
- Commits follow Conventional Commits: `type(scope): description` with types `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`. One logical change per commit.
- Never commit `.env` files or `app/generated/`.
- Run `pnpm lint` and `pnpm build` before committing.

## Known issues

- The MCP client (`mcp-server/src/client.ts`) calls the API without the session cookie, while every API route requires authentication, so MCP tools receive 401 responses.
