import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RawgClient, RawgError } from "./client.js";

// ─── RawgError ────────────────────────────────────────────────────────────────

describe("RawgError", () => {
  it("hereda de Error y expone status, body y name", () => {
    const err = new RawgError("algo falló", 404, "not found body");

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(RawgError);
    expect(err.message).toBe("algo falló");
    expect(err.status).toBe(404);
    expect(err.body).toBe("not found body");
    expect(err.name).toBe("RawgError");
  });

  it("funciona con distintos códigos HTTP", () => {
    const err429 = new RawgError("rate limit", 429, "");
    const err500 = new RawgError("server error", 500, "oops");

    expect(err429.status).toBe(429);
    expect(err500.status).toBe(500);
  });
});

// ─── RawgClient ──────────────────────────────────────────────────────────────

describe("RawgClient", () => {
  let client: RawgClient;

  beforeEach(() => {
    client = new RawgClient();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("llama a fetch con la URL correcta e incluye la API key", async () => {
    const mockData = { count: 0, results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await client.get("/games");

    const calledUrl = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(calledUrl.origin).toBe("https://api.rawg.io");
    expect(calledUrl.pathname).toBe("/api/games");
    expect(calledUrl.searchParams.get("key")).toBe("test-api-key-12345");
  });

  it("añade los parámetros de query correctamente", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    await client.get("/games", { search: "witcher", page: 2, page_size: 10 });

    const calledUrl = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("search")).toBe("witcher");
    expect(calledUrl.searchParams.get("page")).toBe("2");
    expect(calledUrl.searchParams.get("page_size")).toBe("10");
  });

  it("filtra parámetros undefined, null y vacíos", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    await client.get("/games", {
      search: undefined,
      genres: null as unknown as undefined,
      ordering: "",
      page: 1,
    });

    const calledUrl = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(calledUrl.searchParams.has("search")).toBe(false);
    expect(calledUrl.searchParams.has("genres")).toBe(false);
    expect(calledUrl.searchParams.has("ordering")).toBe(false);
    expect(calledUrl.searchParams.get("page")).toBe("1");
  });

  it("devuelve el JSON de la respuesta en caso de éxito", async () => {
    const mockGame = { id: 3498, name: "The Witcher 3" };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGame),
    } as Response);

    const result = await client.get("/games/3498");

    expect(result).toEqual(mockGame);
  });

  it("lanza RawgError cuando la respuesta no es ok (404)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: () => Promise.resolve("Game not found"),
    } as Response);

    await expect(client.get("/games/99999")).rejects.toBeInstanceOf(RawgError);
  });

  it("RawgError lanzado contiene el status HTTP correcto", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: () => Promise.resolve(""),
    } as Response);

    await expect(client.get("/games")).rejects.toMatchObject({ status: 429 });
  });

  it("envía la cabecera Accept: application/json", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    await client.get("/genres");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Accept: "application/json",
    });
  });

  it("pasa AbortSignal a fetch (timeout)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    await client.get("/games");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("lanza RawgError con status 504 si fetch es abortado por timeout", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), { name: "AbortError" }),
    );

    await expect(client.get("/games")).rejects.toMatchObject({
      status: 504,
      name: "RawgError",
    });
  });

  it("trunca el body del error a 500 caracteres", async () => {
    const longBody = "x".repeat(1000);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve(longBody),
    } as Response);

    try {
      await client.get("/games");
    } catch (err) {
      expect((err as RawgError).body.length).toBeLessThanOrEqual(500);
    }
  });
});
