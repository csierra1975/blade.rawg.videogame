import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { RawgError, rawg } from "../rawg/client.js";
import { creatorsRouter } from "./creators.js";

const app = new Hono();
app.route("/api/creators", creatorsRouter);
app.onError((err, c) => {
  if (err instanceof RawgError) return c.json({ error: err.message }, err.status as 404 | 500);
  return c.json({ error: "Internal server error" }, 500);
});

const CREATOR_LIST = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      name: "Hideo Kojima",
      slug: "hideo-kojima",
      games_count: 10,
      positions: [{ id: 1, name: "Director", slug: "director" }],
    },
  ],
};

const CREATOR_DETAIL = {
  id: 1,
  name: "Hideo Kojima",
  slug: "hideo-kojima",
  games_count: 10,
  games: [{ id: 3272, name: "Death Stranding" }],
};

describe("GET /api/creators", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(CREATOR_LIST);
  });

  it("responde 200 y devuelve la lista de creadores", async () => {
    const res = await app.request("/api/creators");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(CREATOR_LIST);
    expect(rawg.get).toHaveBeenCalledWith("/creators", expect.any(Object));
  });

  it("pasa los parámetros de paginación", async () => {
    await app.request("/api/creators?page=1&page_size=10");
    expect(rawg.get).toHaveBeenCalledWith(
      "/creators",
      expect.objectContaining({ page: 1, page_size: 10 }),
    );
  });
});

describe("GET /api/creators/:id", () => {
  it("llama a /creators/:id y devuelve el detalle", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(CREATOR_DETAIL);
    const res = await app.request("/api/creators/1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(CREATOR_DETAIL);
    expect(rawg.get).toHaveBeenCalledWith("/creators/1");
  });

  it("acepta slugs (hideo-kojima)", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(CREATOR_DETAIL);
    await app.request("/api/creators/hideo-kojima");
    expect(rawg.get).toHaveBeenCalledWith("/creators/hideo-kojima");
  });

  it("devuelve 404 si el creador no existe", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(new RawgError("Not Found", 404, ""));
    const res = await app.request("/api/creators/99999");
    expect(res.status).toBe(404);
  });
});
