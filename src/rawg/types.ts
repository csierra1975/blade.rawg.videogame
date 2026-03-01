// ─── Respuestas paginadas ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Entidades base ──────────────────────────────────────────────────────────

export interface Genre {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
  description?: string;
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
  image?: string;
  year_end?: number | null;
  year_start?: number | null;
  games_count: number;
  image_background: string;
}

export interface PlatformInfo {
  platform: Platform;
  released_at?: string;
  requirements?: {
    minimum?: string;
    recommended?: string;
  };
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  domain: string;
  games_count: number;
  image_background: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  language: string;
  games_count: number;
  image_background: string;
}

export interface EsrbRating {
  id: number;
  name: string;
  slug: string;
}

export interface Rating {
  id: number;
  title: string;
  count: number;
  percent: number;
}

export interface MetacriticPlatform {
  metascore: number;
  url: string;
  platform: {
    platform: number;
    name: string;
    slug: string;
  };
}

// ─── Juego en listado ────────────────────────────────────────────────────────

export interface Game {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  tba: boolean;
  background_image: string | null;
  rating: number;
  rating_top: number;
  ratings: Rating[];
  ratings_count: number;
  reviews_text_count: number;
  added: number;
  metacritic: number | null;
  playtime: number;
  suggestions_count: number;
  updated: string;
  platforms: PlatformInfo[] | null;
  genres: Genre[];
  tags: Tag[];
  esrb_rating: EsrbRating | null;
  short_screenshots: Screenshot[];
}

// ─── Detalles completos del juego ────────────────────────────────────────────

export interface GameDetails extends Game {
  name_original: string;
  description: string;
  description_raw: string;
  metacritic_platforms: MetacriticPlatform[];
  background_image_additional: string | null;
  website: string;
  stores: GameStore[];
  developers: Developer[];
  publishers: Publisher[];
  reddit_url: string;
  reddit_name: string;
  reddit_description: string;
  reddit_logo: string;
  reddit_count: number;
  twitch_count: number;
  youtube_count: number;
  reviews_text_count: number;
  achievements_count: number;
  parent_achievements_count: number;
  clip: unknown;
  movies_count: number;
  parent_games: unknown[];
  alternative_names: string[];
}

// ─── Logros ──────────────────────────────────────────────────────────────────

export interface Achievement {
  id: number;
  name: string;
  description: string;
  image: string;
  percent: string;
}

// ─── Capturas ────────────────────────────────────────────────────────────────

export interface Screenshot {
  id: number;
  image: string;
  width?: number;
  height?: number;
  is_deleted?: boolean;
}

// ─── Tráilers ────────────────────────────────────────────────────────────────

export interface Trailer {
  id: number;
  name: string;
  preview: string;
  data: {
    480: string;
    max: string;
  };
}

// ─── Tiendas del juego ───────────────────────────────────────────────────────

export interface GameStore {
  id: number;
  url: string;
  store: Store;
}

// ─── Creadores / Equipo ──────────────────────────────────────────────────────

export interface Creator {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  image_background: string;
  games_count: number;
  positions?: Position[];
  games?: GameBrief[];
}

export interface Position {
  id: number;
  name: string;
  slug: string;
}

export interface GameBrief {
  id: number;
  slug: string;
  name: string;
  added: number;
}

// ─── Desarrolladoras y Publicadoras ──────────────────────────────────────────

export interface Developer {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
  description?: string;
  games?: GameBrief[];
}

export interface Publisher {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
  description?: string;
  games?: GameBrief[];
}

// ─── Reddit ──────────────────────────────────────────────────────────────────

export interface RedditPost {
  id: number;
  name: string;
  text: string;
  image: string;
  url: string;
  username: string;
  username_url: string;
  created: string;
}

// ─── Parámetros de query comunes ─────────────────────────────────────────────

export interface GamesListParams {
  page?: number;
  page_size?: number;
  search?: string;
  search_precise?: boolean;
  search_exact?: boolean;
  parent_platforms?: string;
  platforms?: string;
  stores?: string;
  developers?: string;
  publishers?: string;
  genres?: string;
  tags?: string;
  dates?: string;
  updated?: string;
  platforms_count?: number;
  metacritic?: string;
  exclude_collection?: number;
  exclude_additions?: boolean;
  exclude_parents?: boolean;
  exclude_game_series?: boolean;
  exclude_stores?: string;
  ordering?: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  ordering?: string;
}
