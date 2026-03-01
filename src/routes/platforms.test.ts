import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { RawgError, rawg } from "../rawg/client.js";
import { platformsRouter } from "./platforms.js";

const app = new Hono();
app.route("/api/platforms", platformsRouter);
app.onError((err, c) => {
  if (err instanceof RawgError) return c.json({ error: err.message }, err.status as 404 | 500);
  return c.json({ error: "Internal server error" }, 500);
});

const PLATFORM_LIST = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 4, name: "PC", slug: "pc", games_count: 50000 },
    { id: 18, name: "PlayStation 4", slug: "playstation4", games_count: 3000 },
  ],
};

const PLATFORM_DETAIL = { id: 4, name: "PC", slug: "pc", games_count: 50000 };

describe("GET /api/platforms", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(PLATFORM_LIST);
  });

  it("responde 200 y devuelve la lista de plataformas", async () => {
    const res = await app.request("/api/platforms");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PLATFORM_LIST);
    expect(rawg.get).toHaveBeenCalledWith("/platforms", expect.any(Object));
  });

  it("pasa los parámetros de paginación y ordenación", async () => {
    await app.request("/api/platforms?page=1&ordering=name");
    expect(rawg.get).toHaveBeenCalledWith(
      "/platforms",
      expect.objectContaining({ page: 1, ordering: "name" }),
    );
  });
});

describe("GET /api/platforms/:id", () => {
  it("llama a /platforms/:id y devuelve el detalle", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(PLATFORM_DETAIL);
    const res = await app.request("/api/platforms/4");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PLATFORM_DETAIL);
    expect(rawg.get).toHaveBeenCalledWith("/platforms/4");
  });

  it("acepta slugs", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(PLATFORM_DETAIL);
    await app.request("/api/platforms/pc");
    expect(rawg.get).toHaveBeenCalledWith("/platforms/pc");
  });

  it("devuelve 404 cuando el recurso no existe", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(new RawgError("Not Found", 404, ""));
    const res = await app.request("/api/platforms/99999");
    expect(res.status).toBe(404);
  });
});
