import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { RawgError, rawg } from "../rawg/client.js";
import { gamesRouter } from "./games.js";

// Monta el router igual que en index.ts
const app = new Hono();
app.route("/api/games", gamesRouter);
app.onError((err, c) => {
  if (err instanceof RawgError) {
    return c.json({ error: err.message }, err.status as 400 | 404 | 429 | 500);
  }
  return c.json({ error: "Internal server error" }, 500);
});

const GAME_LIST = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 1, name: "The Witcher 3", slug: "the-witcher-3-wild-hunt" },
    { id: 2, name: "God of War", slug: "god-of-war" },
  ],
};

const GAME_DETAIL = {
  id: 3498,
  name: "The Witcher 3: Wild Hunt",
  slug: "the-witcher-3-wild-hunt",
  description: "An open-world RPG.",
};

// ─── GET /api/games ──────────────────────────────────────────────────────────

describe("GET /api/games", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(GAME_LIST);
  });

  it("responde 200 y devuelve la lista de juegos", async () => {
    const res = await app.request("/api/games");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(GAME_LIST);
  });

  it("pasa el parámetro search a rawg.get", async () => {
    await app.request("/api/games?search=witcher");
    expect(rawg.get).toHaveBeenCalledWith("/games", expect.objectContaining({ search: "witcher" }));
  });

  it("pasa los filtros de géneros, plataformas y metacritic", async () => {
    await app.request("/api/games?genres=action,rpg&platforms=4,18&metacritic=80,100");
    expect(rawg.get).toHaveBeenCalledWith(
      "/games",
      expect.objectContaining({ genres: "action,rpg", platforms: "4,18", metacritic: "80,100" }),
    );
  });

  it("pasa el parámetro ordering", async () => {
    await app.request("/api/games?ordering=-metacritic");
    expect(rawg.get).toHaveBeenCalledWith(
      "/games",
      expect.objectContaining({ ordering: "-metacritic" }),
    );
  });

  it("pasa paginación (page y page_size)", async () => {
    await app.request("/api/games?page=2&page_size=40");
    expect(rawg.get).toHaveBeenCalledWith(
      "/games",
      expect.objectContaining({ page: "2", page_size: "40" }),
    );
  });

  it("devuelve 500 si rawg.get lanza un Error genérico", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(new Error("network error"));
    const res = await app.request("/api/games");
    expect(res.status).toBe(500);
  });

  it("devuelve el status HTTP de RawgError cuando la API falla", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(new RawgError("Not Found", 404, ""));
    const res = await app.request("/api/games");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Not Found");
  });
});

// ─── GET /api/games/:id ───────────────────────────────────────────────────────

describe("GET /api/games/:id", () => {
  it("llama a rawg.get con /games/:id y devuelve el detalle", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(GAME_DETAIL);
    const res = await app.request("/api/games/3498");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(GAME_DETAIL);
    expect(rawg.get).toHaveBeenCalledWith("/games/3498");
  });

  it("acepta slugs además de IDs numéricos", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(GAME_DETAIL);
    await app.request("/api/games/the-witcher-3-wild-hunt");
    expect(rawg.get).toHaveBeenCalledWith("/games/the-witcher-3-wild-hunt");
  });
});

// ─── Sub-rutas de juegos ──────────────────────────────────────────────────────

describe("GET /api/games/:id/achievements", () => {
  it("llama al endpoint correcto", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    const res = await app.request("/api/games/3498/achievements?page=1&page_size=20");

    expect(res.status).toBe(200);
    expect(rawg.get).toHaveBeenCalledWith(
      "/games/3498/achievements",
      expect.objectContaining({ page: "1", page_size: "20" }),
    );
  });
});

describe("GET /api/games/:id/trailers", () => {
  it("llama a /games/:id/movies", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/trailers");
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/movies");
  });
});

describe("GET /api/games/:id/screenshots", () => {
  it("llama al endpoint correcto con paginación", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/screenshots?page=2");
    expect(rawg.get).toHaveBeenCalledWith(
      "/games/3498/screenshots",
      expect.objectContaining({ page: "2" }),
    );
  });
});

describe("GET /api/games/:id/stores", () => {
  it("llama a /games/:id/stores", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/stores");
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/stores");
  });
});

describe("GET /api/games/:id/dlcs", () => {
  it("llama a /games/:id/additions", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/dlcs");
    expect(rawg.get).toHaveBeenCalledWith(
      "/games/3498/additions",
      expect.any(Object),
    );
  });
});

describe("GET /api/games/:id/series", () => {
  it("llama a /games/:id/game-series", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/series");
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/game-series", expect.any(Object));
  });
});

describe("GET /api/games/:id/parent", () => {
  it("llama a /games/:id/parent-games", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/parent");
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/parent-games", expect.any(Object));
  });
});

describe("GET /api/games/:id/team", () => {
  it("llama a /games/:id/development-team", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/team");
    expect(rawg.get).toHaveBeenCalledWith(
      "/games/3498/development-team",
      expect.any(Object),
    );
  });
});

describe("GET /api/games/:id/reddit", () => {
  it("llama a /games/:id/reddit", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({ count: 0, results: [] });
    await app.request("/api/games/3498/reddit");
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/reddit");
  });
});
