import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mockeamos config antes de importar el middleware
vi.mock("../config.js", () => ({
  config: { apiSecretKey: "test-secret" },
}));

import { apiKeyAuth } from "./auth.js";

function buildApp() {
  const app = new Hono();
  app.use("/api/*", apiKeyAuth);
  app.get("/api/test", (c) => c.json({ ok: true }));
  return app;
}

describe("apiKeyAuth middleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
  });

  it("devuelve 403 si no se envía x-api-key", async () => {
    const res = await app.request("/api/test");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden: invalid or missing API key" });
  });

  it("devuelve 403 si la clave es incorrecta", async () => {
    const res = await app.request("/api/test", {
      headers: { "x-api-key": "wrong-key" },
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden: invalid or missing API key" });
  });

  it("permite el acceso con la clave correcta", async () => {
    const res = await app.request("/api/test", {
      headers: { "x-api-key": "test-secret" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("no afecta a rutas fuera de /api/*", async () => {
    const app2 = new Hono();
    app2.use("/api/*", apiKeyAuth);
    app2.get("/health", (c) => c.json({ ok: true }));

    const res = await app2.request("/health");
    expect(res.status).toBe(200);
  });
});
