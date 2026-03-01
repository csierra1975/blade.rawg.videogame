import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type { Publisher, PaginatedResponse } from "../rawg/types.js";
import {
  VALID_CATALOG_ORDERING,
  isValidId,
  sanitizePage,
  sanitizePageSize,
} from "../rawg/validate.js";

export const publishersRouter = new Hono();

// GET /api/publishers - Listar publicadoras
publishersRouter.get("/", async (c) => {
  const { page, page_size, ordering } = c.req.query();
  const safeOrdering = VALID_CATALOG_ORDERING.has(ordering ?? "") ? ordering : undefined;

  const data = await rawg.get<PaginatedResponse<Publisher>>("/publishers", {
    page: sanitizePage(page),
    page_size: sanitizePageSize(page_size),
    ordering: safeOrdering,
  });
  return c.json(data);
});

// GET /api/publishers/:id - Detalles de una publicadora
publishersRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!isValidId(id)) return c.json({ error: "Invalid id parameter" }, 400);

  const data = await rawg.get<Publisher>(`/publishers/${id}`);
  return c.json(data);
});
