// ─── Validación de parámetros recibidos del exterior ─────────────────────────

/** Permite IDs numéricos y slugs tipo "the-witcher-3-wild-hunt" o "cd_projekt_red" */
const ID_REGEX = /^[a-zA-Z0-9_-]{1,200}$/;

export function isValidId(id: string): boolean {
  return ID_REGEX.test(id);
}

/** Valores de ordenación permitidos para el endpoint /games */
export const VALID_GAME_ORDERING = new Set([
  "name", "-name",
  "released", "-released",
  "added", "-added",
  "created", "-created",
  "updated", "-updated",
  "rating", "-rating",
  "metacritic", "-metacritic",
]);

/** Valores de ordenación permitidos para endpoints de catálogo (géneros, plataformas, etc.) */
export const VALID_CATALOG_ORDERING = new Set([
  "name", "-name",
  "games_count", "-games_count",
]);

/**
 * Devuelve un page seguro: entero positivo, mínimo 1.
 * Si el valor recibido es inválido devuelve undefined para omitirlo.
 */
export function sanitizePage(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

/**
 * Devuelve un page_size seguro: entero entre 1 y 40.
 * Si el valor recibido es inválido devuelve undefined para omitirlo.
 */
export function sanitizePageSize(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 40) : undefined;
}
