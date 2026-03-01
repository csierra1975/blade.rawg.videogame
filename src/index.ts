import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { config } from "./config.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { RawgError } from "./rawg/client.js";
import { creatorsRouter } from "./routes/creators.js";
import { developersRouter } from "./routes/developers.js";
import { gamesRouter } from "./routes/games.js";
import { genresRouter } from "./routes/genres.js";
import { platformsRouter } from "./routes/platforms.js";
import { publishersRouter } from "./routes/publishers.js";
import { tagsRouter } from "./routes/tags.js";

const app = new Hono();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use("*", secureHeaders());

app.use(
  "*",
  cors({
    origin: config.corsOrigin === "*" ? "*" : config.corsOrigin.split(",").map((o) => o.trim()),
    allowMethods: ["GET"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.use("*", logger());
app.use("/api/*", rateLimit(config.rateLimit));

// ─── Rutas ───────────────────────────────────────────────────────────────────

app.route("/api/games", gamesRouter);
app.route("/api/genres", genresRouter);
app.route("/api/platforms", platformsRouter);
app.route("/api/creators", creatorsRouter);
app.route("/api/developers", developersRouter);
app.route("/api/publishers", publishersRouter);
app.route("/api/tags", tagsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/", (c) =>
  c.json({
    name: "RAWG API",
    version: "1.0.0",
    description: "API wrapper sobre RAWG.io con soporte MCP",
    endpoints: {
      games: "/api/games",
      genres: "/api/genres",
      platforms: "/api/platforms",
      creators: "/api/creators",
      developers: "/api/developers",
      publishers: "/api/publishers",
      tags: "/api/tags",
    },
    rawg_docs: "https://rawg.io/apidocs",
  }),
);

// ─── Error handler global ─────────────────────────────────────────────────────

app.onError((err, c) => {
  if (err instanceof RawgError) {
    console.error(`[RawgError] status=${err.status} body=${err.body}`);

    if (err.status === 404) return c.json({ error: "Resource not found" }, 404);
    if (err.status === 429) return c.json({ error: "Service temporarily unavailable. Try again later." }, 503);
    if (err.status === 504) return c.json({ error: "Upstream service timeout. Try again later." }, 504);
    return c.json({ error: "Upstream service error" }, 502);
  }

  console.error("[UnhandledError]", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Route not found" }, 404));

// ─── Start server ─────────────────────────────────────────────────────────────

console.log(`RAWG API arrancando en http://localhost:${config.port}`);

serve({
  fetch: app.fetch,
  port: config.port,
});
