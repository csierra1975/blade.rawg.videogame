import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Platform, PaginatedResponse } from "../rawg/types.js";
import {
  VALID_CATALOG_ORDERING,
  isValidId,
  sanitizePage,
  sanitizePageSize,
} from "../rawg/validate.js";

export const platformsRouter = new Hono();

// GET /api/platforms - Listar todas las plataformas
platformsRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const safeOrdering = VALID_CATALOG_ORDERING.has(ordering ?? "") ? ordering : undefined;

  const data = await rawg.get<PaginatedResponse<Platform>>("/platforms", {
    page: sanitizePage(page),
    page_size: sanitizePageSize(page_size),
    ordering: safeOrdering,
  });
  return c.json(data);
});

// GET /api/platforms/:id - Detalles de una plataforma
platformsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!isValidId(id)) return c.json({ error: "Invalid id parameter" }, 400);

  const data = await rawg.get<Platform>(`/platforms/${id}`);
  return c.json(data);
});
