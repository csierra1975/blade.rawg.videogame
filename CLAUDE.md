# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # HTTP server (tsx, hot-reload)
npm run dev:mcp      # MCP stdio server (tsx, hot-reload)
npm run build        # Compile TypeScript → dist/
npm test             # Run all tests once
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests + coverage report
```

Run a single test file:
```bash
npx vitest run src/routes/games.test.ts
```

## Environment

Requires a `.env` file at the root (see `.env.example`):

```env
RAWG_API_KEY=...        # Required. Key from rawg.io/apidocs
API_SECRET_KEY=...      # Required. Protects all /api/* HTTP endpoints
PORT=3000               # Optional (default 3000)
RATE_LIMIT=60           # Optional, requests/IP/minute (default 60)
CORS_ORIGIN=*           # Optional, comma-separated origins
```

`src/config.ts` validates these on startup and calls `process.exit(1)` if required vars are missing.

`src/test-setup.ts` sets stub env vars (`RAWG_API_KEY`, `PORT`) before each test file so `config.ts` doesn't abort during tests. If you add a required env var to `config.ts`, add its stub here too.

## Architecture

The project exposes the same RAWG.io data through **two independent servers**:

- **`src/index.ts`** — Hono HTTP REST API, runs on `PORT`
- **`src/mcp.ts`** — MCP stdio server for Claude Desktop integration

Both share the same RAWG client (`src/rawg/client.ts`) and types (`src/rawg/types.ts`).

### HTTP API middleware stack (`/api/*`)

Applied in order in `src/index.ts`:
1. `secureHeaders()` — security headers (all routes)
2. `cors()` — CORS, allows `x-api-key` header
3. `logger()` — request logging
4. `apiKeyAuth` — checks `x-api-key` header against `API_SECRET_KEY` → 403 if missing/wrong
5. `rateLimit` — per-IP sliding window (default 60 req/min) → 429 if exceeded

### Adding a new route

1. Create `src/routes/<resource>.ts` — `new Hono()` router, import `rawg` client
2. Use `isValidId`, `sanitizePage`, `sanitizePageSize` from `src/rawg/validate.ts` for all user-supplied params
3. Register in `src/index.ts`: `app.route("/api/<resource>", <resource>Router)`
4. Create `src/routes/<resource>.test.ts` — mock `rawg` via `vi.mock("../rawg/client.js")`, build a local `Hono` app without auth middleware (tests are unit-level, middleware is tested separately)

### Adding a new MCP tool

Tools live in `src/mcp/tools.ts`. Add an entry to `MCP_TOOLS` (the Zod-validated schema array) and a `case` in `handleTool`. The MCP server does **not** require `API_SECRET_KEY`.

### Error handling

- `RawgError` (thrown by `src/rawg/client.ts`) carries `status` and `body`. The global error handler in `src/index.ts` maps known RAWG statuses (404, 429, 504) to appropriate HTTP responses.
- Routes should let errors propagate — do not catch `RawgError` inside route handlers.

### Input validation conventions

- `:id` params: always validate with `isValidId()` before passing to `rawg.get()`
- Pagination: always pass through `sanitizePage()` / `sanitizePageSize()`
- `ordering` params: whitelist against `VALID_GAME_ORDERING` or `VALID_CATALOG_ORDERING` sets
- Query filters (genres, platforms, etc.): pass directly to RAWG without extra validation
