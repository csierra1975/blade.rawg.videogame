import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { RawgError, rawg } from "../rawg/client.js";
import { publishersRouter } from "./publishers.js";

const app = new Hono();
app.route("/api/publishers", publishersRouter);
app.onError((err, c) => {
  if (err instanceof RawgError) return c.json({ error: err.message }, err.status as 404 | 500);
  return c.json({ error: "Internal server error" }, 500);
});

const PUB_LIST = {
  count: 1,
  next: null,
  previous: null,
  results: [{ id: 109, name: "Electronic Arts", slug: "electronic-arts", games_count: 1200 }],
};

const PUB_DETAIL = {
  id: 109,
  name: "Electronic Arts",
  slug: "electronic-arts",
  games_count: 1200,
  description: "American publisher.",
};

describe("GET /api/publishers", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(PUB_LIST);
  });

  it("responde 200 y devuelve la lista de publicadoras", async () => {
    const res = await app.request("/api/publishers");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PUB_LIST);
    expect(rawg.get).toHaveBeenCalledWith("/publishers", expect.any(Object));
  });

  it("pasa los parámetros de paginación y ordenación", async () => {
    await app.request("/api/publishers?page=2&ordering=-games_count");
    expect(rawg.get).toHaveBeenCalledWith(
      "/publishers",
      expect.objectContaining({ page: "2", ordering: "-games_count" }),
    );
  });
});

describe("GET /api/publishers/:id", () => {
  it("llama a /publishers/:id y devuelve el detalle", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(PUB_DETAIL);
    const res = await app.request("/api/publishers/109");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PUB_DETAIL);
    expect(rawg.get).toHaveBeenCalledWith("/publishers/109");
  });

  it("acepta slugs (electronic-arts)", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(PUB_DETAIL);
    await app.request("/api/publishers/electronic-arts");
    expect(rawg.get).toHaveBeenCalledWith("/publishers/electronic-arts");
  });

  it("devuelve 429 cuando se excede el rate limit", async () => {
    vi.mocked(rawg.get).mockRejectedValueOnce(
      new RawgError("Too Many Requests", 429, ""),
    );
    const res = await app.request("/api/publishers/109");
    expect(res.status).toBe(429);
  });
});
