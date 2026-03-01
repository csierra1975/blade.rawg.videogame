import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { RawgError, rawg } from "../rawg/client.js";
import { genresRouter } from "./genres.js";

const app = new Hono();
app.route("/api/genres", genresRouter);
app.onError((err, c) => {
  if (err instanceof RawgError) return c.json({ error: err.message }, err.status as 404 | 500);
  return c.json({ error: "Internal server error" }, 500);
});

const GENRE_LIST = {
  count: 3,
  next: null,
  previous: null,
  results: [
    { id: 4, name: "Action", slug: "action", games_count: 10000 },
    { id: 5, name: "RPG", slug: "role-playing-games-rpg", games_count: 5000 },
  ],
};

const GENRE_DETAIL = { id: 4, name: "Action", slug: "action", games_count: 10000 };

describe("GET /api/genres", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(GENRE_LIST);
  });

  it("responde 200 y devuelve la lista de géneros", async () => {
    const res = await app.request("/api/genres");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(GENRE_LIST);
    expect(rawg.get).toHaveBeenCalledWith("/genres", expect.any(Object));
  });

  it("pasa los parámetros de paginación y ordenación", async () => {
    await app.request("/api/genres?page=2&page_size=10&ordering=-games_count");
    expect(rawg.get).toHaveBeenCalledWith(
      "/genres",
      expect.objectContaining({ page: "2", page_size: "10", ordering: "-games_count" }),
    );
  });

  it("devuelve 404 cuando la API falla con RawgError 404", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(new RawgError("Not Found", 404, ""));
    const res = await app.request("/api/genres");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/genres/:id", () => {
  it("llama a /genres/:id y devuelve el detalle", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(GENRE_DETAIL);
    const res = await app.request("/api/genres/4");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(GENRE_DETAIL);
    expect(rawg.get).toHaveBeenCalledWith("/genres/4");
  });

  it("acepta slugs además de IDs numéricos", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(GENRE_DETAIL);
    await app.request("/api/genres/action");
    expect(rawg.get).toHaveBeenCalledWith("/genres/action");
  });
});
