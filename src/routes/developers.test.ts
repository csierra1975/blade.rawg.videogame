import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { RawgError, rawg } from "../rawg/client.js";
import { developersRouter } from "./developers.js";

const app = new Hono();
app.route("/api/developers", developersRouter);
app.onError((err, c) => {
  if (err instanceof RawgError) return c.json({ error: err.message }, err.status as 404 | 500);
  return c.json({ error: "Internal server error" }, 500);
});

const DEV_LIST = {
  count: 1,
  next: null,
  previous: null,
  results: [{ id: 4062, name: "CD Projekt Red", slug: "cd-projekt-red", games_count: 6 }],
};

const DEV_DETAIL = {
  id: 4062,
  name: "CD Projekt Red",
  slug: "cd-projekt-red",
  games_count: 6,
  description: "Polish studio.",
  games: [{ id: 3498, name: "The Witcher 3" }],
};

describe("GET /api/developers", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(DEV_LIST);
  });

  it("responde 200 y devuelve la lista de desarrolladoras", async () => {
    const res = await app.request("/api/developers");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(DEV_LIST);
    expect(rawg.get).toHaveBeenCalledWith("/developers", expect.any(Object));
  });

  it("pasa los parámetros de paginación", async () => {
    await app.request("/api/developers?page=3&page_size=20");
    expect(rawg.get).toHaveBeenCalledWith(
      "/developers",
      expect.objectContaining({ page: "3", page_size: "20" }),
    );
  });
});

describe("GET /api/developers/:id", () => {
  it("llama a /developers/:id y devuelve el detalle", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(DEV_DETAIL);
    const res = await app.request("/api/developers/4062");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(DEV_DETAIL);
    expect(rawg.get).toHaveBeenCalledWith("/developers/4062");
  });

  it("acepta slugs (cd-projekt-red)", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(DEV_DETAIL);
    await app.request("/api/developers/cd-projekt-red");
    expect(rawg.get).toHaveBeenCalledWith("/developers/cd-projekt-red");
  });

  it("devuelve 404 cuando la desarrolladora no existe", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(new RawgError("Not Found", 404, ""));
    const res = await app.request("/api/developers/99999");
    expect(res.status).toBe(404);
  });
});
