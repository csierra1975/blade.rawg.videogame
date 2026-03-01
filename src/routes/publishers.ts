import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Publisher, PaginatedResponse } from "../rawg/types.js";

export const publishersRouter = new Hono();

// GET /api/publishers - Listar publicadoras
publishersRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Publisher>>("/publishers", {
    page, page_size, ordering,
  });
  return c.json(data);
});

// GET /api/publishers/:id - Detalles de una publicadora
publishersRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<Publisher>(`/publishers/${id}`);
  return c.json(data);
});
