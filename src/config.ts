import "dotenv/config";

// ─── Validación de PORT ───────────────────────────────────────────────────────
const portRaw = parseInt(process.env.PORT ?? "3000", 10);
if (isNaN(portRaw) || portRaw < 1 || portRaw > 65535) {
  console.error(`ERROR: PORT inválido: "${process.env.PORT}". Debe ser un número entre 1 y 65535.`);
  process.exit(1);
}

// ─── Validación de RATE_LIMIT ─────────────────────────────────────────────────
const rateLimitRaw = parseInt(process.env.RATE_LIMIT ?? "60", 10);
if (isNaN(rateLimitRaw) || rateLimitRaw < 1) {
  console.error(`ERROR: RATE_LIMIT inválido: "${process.env.RATE_LIMIT}". Debe ser un entero positivo.`);
  process.exit(1);
}

export const config = {
  rawgApiKey: process.env.RAWG_API_KEY ?? "",
  port: portRaw,
  rawgBaseUrl: "https://api.rawg.io/api",
  /** Orígenes CORS permitidos. Usa "*" para desarrollo o una lista separada por comas en producción. */
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  /** Máximo de peticiones por IP por minuto (defecto: 60). */
  rateLimit: rateLimitRaw,
  /** Timeout en ms para peticiones a RAWG (defecto: 10 s). */
  fetchTimeoutMs: 10_000,
};

if (!config.rawgApiKey) {
  console.error("ERROR: RAWG_API_KEY no definida. Crea un fichero .env con RAWG_API_KEY=tu_clave");
  console.error("Obtén tu clave en: https://rawg.io/apidocs");
  process.exit(1);
}
