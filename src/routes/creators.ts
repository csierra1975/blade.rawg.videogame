import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Creator, PaginatedResponse } from "../rawg/types.js";

export const creatorsRouter = new Hono();

// GET /api/creators - Listar creadores
creatorsRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Creator>>("/creators", {
    page, page_size, ordering,
  });
  return c.json(data);
});

// GET /api/creators/:id - Detalles de un creador
creatorsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<Creator>(`/creators/${id}`);
  return c.json(data);
});
