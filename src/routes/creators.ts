import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Creator, PaginatedResponse } from "../rawg/types.js";
import { isValidId, sanitizePage, sanitizePageSize } from "../rawg/validate.js";

export const creatorsRouter = new Hono();

// GET /api/creators - Listar creadores
creatorsRouter.get("/", async (c) => {
  const { page, page_size } = c.req.query();

  const data = await rawg.get<PaginatedResponse<Creator>>("/creators", {
    page: sanitizePage(page),
    page_size: sanitizePageSize(page_size),
  });
  return c.json(data);
});

// GET /api/creators/:id - Detalles de un creador
creatorsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!isValidId(id)) return c.json({ error: "Invalid id parameter" }, 400);

  const data = await rawg.get<Creator>(`/creators/${id}`);
  return c.json(data);
});
