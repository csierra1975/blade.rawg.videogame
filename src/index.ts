import { serve } from "@hono/node-server";
import { config } from "./config.js";
import app from "./app.js";

console.log(`RAWG API arrancando en http://localhost:${config.port}`);

serve({
  fetch: app.fetch,
  port: config.port,
});
