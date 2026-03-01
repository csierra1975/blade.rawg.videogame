import type { MiddlewareHandler } from "hono";
import { config } from "../config.js";

/**
 * Middleware de autenticación por API key.
 * Comprueba que la cabecera `x-api-key` coincide con API_SECRET_KEY del entorno.
 * Devuelve 403 si la clave falta o no coincide.
 */
export const apiKeyAuth: MiddlewareHandler = async (c, next) => {
  const provided = c.req.header("x-api-key");

  if (!provided || provided !== config.apiSecretKey) {
    return c.json({ error: "Forbidden: invalid or missing API key" }, 403);
  }

  await next();
};
