import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Platform, PaginatedResponse } from "../rawg/types.js";

export const platformsRouter = new Hono();

// GET /api/platforms - Listar todas las plataformas
platformsRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Platform>>("/platforms", {
    page, page_size, ordering,
  });
  return c.json(data);
});

// GET /api/platforms/:id - Detalles de una plataforma
platformsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<Platform>(`/platforms/${id}`);
  return c.json(data);
});
