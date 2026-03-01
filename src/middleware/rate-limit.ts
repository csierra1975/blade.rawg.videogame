import type { MiddlewareHandler } from "hono";

const WINDOW_MS = 60_000; // ventana de 1 minuto

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Limpia entradas expiradas cada 5 minutos para evitar memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60_000).unref();

/**
 * Middleware de rate limiting por IP (ventana fija de 1 minuto).
 * @param limit  Número máximo de peticiones permitidas por ventana.
 */
export function rateLimit(limit: number): MiddlewareHandler {
  return async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const now = Date.now();
    let entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      store.set(ip, entry);
    }

    if (entry.count >= limit) {
      return c.json(
        { error: "Too many requests. Try again in a moment." },
        429,
      );
    }

    entry.count++;

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(limit - entry.count));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    await next();
  };
}
