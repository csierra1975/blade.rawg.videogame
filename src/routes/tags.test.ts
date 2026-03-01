import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { RawgError, rawg } from "../rawg/client.js";
import { tagsRouter } from "./tags.js";

const app = new Hono();
app.route("/api/tags", tagsRouter);
app.onError((err, c) => {
  if (err instanceof RawgError) return c.json({ error: err.message }, err.status as 404 | 500);
  return c.json({ error: "Internal server error" }, 500);
});

const TAG_LIST = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 31, name: "Singleplayer", slug: "singleplayer", language: "eng", games_count: 80000 },
    { id: 7, name: "Multiplayer", slug: "multiplayer", language: "eng", games_count: 35000 },
  ],
};

const TAG_DETAIL = {
  id: 31,
  name: "Singleplayer",
  slug: "singleplayer",
  language: "eng",
  games_count: 80000,
};

describe("GET /api/tags", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(TAG_LIST);
  });

  it("responde 200 y devuelve la lista de tags", async () => {
    const res = await app.request("/api/tags");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(TAG_LIST);
    expect(rawg.get).toHaveBeenCalledWith("/tags", expect.any(Object));
  });

  it("pasa los parámetros de paginación y ordenación", async () => {
    await app.request("/api/tags?page=2&page_size=5&ordering=name");
    expect(rawg.get).toHaveBeenCalledWith(
      "/tags",
      expect.objectContaining({ page: "2", page_size: "5", ordering: "name" }),
    );
  });
});

describe("GET /api/tags/:id", () => {
  it("llama a /tags/:id y devuelve el detalle", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(TAG_DETAIL);
    const res = await app.request("/api/tags/31");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(TAG_DETAIL);
    expect(rawg.get).toHaveBeenCalledWith("/tags/31");
  });

  it("acepta slugs (singleplayer)", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(TAG_DETAIL);
    await app.request("/api/tags/singleplayer");
    expect(rawg.get).toHaveBeenCalledWith("/tags/singleplayer");
  });

  it("devuelve 404 si el tag no existe", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(new RawgError("Not Found", 404, ""));
    const res = await app.request("/api/tags/tag-inexistente");
    expect(res.status).toBe(404);
  });
});
