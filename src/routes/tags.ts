import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Tag, PaginatedResponse } from "../rawg/types.js";

export const tagsRouter = new Hono();

// GET /api/tags - Listar todos los tags
tagsRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Tag>>("/tags", {
    page, page_size, ordering,
  });
  return c.json(data);
});

// GET /api/tags/:id - Detalles de un tag
tagsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<Tag>(`/tags/${id}`);
  return c.json(data);
});
