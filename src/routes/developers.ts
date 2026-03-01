import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Developer, PaginatedResponse } from "../rawg/types.js";

export const developersRouter = new Hono();

// GET /api/developers - Listar desarrolladoras
developersRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Developer>>("/developers", {
    page, page_size, ordering,
  });
  return c.json(data);
});

// GET /api/developers/:id - Detalles de una desarrolladora
developersRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<Developer>(`/developers/${id}`);
  return c.json(data);
});
