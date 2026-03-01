import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Genre, PaginatedResponse } from "../rawg/types.js";

export const genresRouter = new Hono();

// GET /api/genres - Listar todos los géneros
genresRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Genre>>("/genres", {
    page, page_size, ordering,
  });
  return c.json(data);
});

// GET /api/genres/:id - Detalles de un género
genresRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<Genre>(`/genres/${id}`);
  return c.json(data);
});
