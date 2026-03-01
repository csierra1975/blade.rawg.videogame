import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "./config.js";
import { RawgError } from "./rawg/client.js";
import { gamesRouter } from "./routes/games.js";
import { genresRouter } from "./routes/genres.js";
import { platformsRouter } from "./routes/platforms.js";
import { creatorsRouter } from "./routes/creators.js";
import { developersRouter } from "./routes/developers.js";
import { publishersRouter } from "./routes/publishers.js";
import { tagsRouter } from "./routes/tags.js";

const app = new Hono();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use("*", cors());
app.use("*", logger());

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
    return c.json(
      { error: err.message, rawg_status: err.status },
      err.status as 400 | 404 | 429 | 500,
    );
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Route not found" }, 404));

// ─── Start server ─────────────────────────────────────────────────────────────

console.log(`RAWG API arrancando en http://localhost:${config.port}`);

serve({
  fetch: app.fetch,
  port: config.port,
});
