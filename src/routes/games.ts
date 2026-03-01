import { Hono } from "hono";
import { rawg } from "../rawg/client.js";
import type {
  Game,
  GameDetails,
  Achievement,
  Screenshot,
  Trailer,
  GameStore,
  Creator,
  RedditPost,
  PaginatedResponse,
} from "../rawg/types.js";

export const gamesRouter = new Hono();

// GET /api/games - Listar y buscar juegos
gamesRouter.get("/", async (c) => {
  const {
    page, page_size, search, search_precise, search_exact,
    parent_platforms, platforms, stores, developers, publishers,
    genres, tags, dates, metacritic, exclude_additions, exclude_parents,
    exclude_game_series, ordering,
  } = c.req.query();

  const data = await rawg.get<PaginatedResponse<Game>>("/games", {
    page, page_size, search, search_precise, search_exact,
    parent_platforms, platforms, stores, developers, publishers,
    genres, tags, dates, metacritic, exclude_additions, exclude_parents,
    exclude_game_series, ordering,
  });

  return c.json(data);
});

// GET /api/games/:id - Detalles completos del juego
gamesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<GameDetails>(`/games/${id}`);
  return c.json(data);
});

// GET /api/games/:id/achievements - Logros del juego
gamesRouter.get("/:id/achievements", async (c) => {
  const id = c.req.param("id");
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Achievement>>(
    `/games/${id}/achievements`,
    { page, page_size, ordering },
  );
  return c.json(data);
});

// GET /api/games/:id/trailers - Tráilers y videos del juego
gamesRouter.get("/:id/trailers", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<PaginatedResponse<Trailer>>(`/games/${id}/movies`);
  return c.json(data);
});

// GET /api/games/:id/screenshots - Capturas de pantalla
gamesRouter.get("/:id/screenshots", async (c) => {
  const id = c.req.param("id");
  const { page, page_size } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Screenshot>>(
    `/games/${id}/screenshots`,
    { page, page_size },
  );
  return c.json(data);
});

// GET /api/games/:id/stores - Tiendas donde se vende el juego
gamesRouter.get("/:id/stores", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<PaginatedResponse<GameStore>>(`/games/${id}/stores`);
  return c.json(data);
});

// GET /api/games/:id/dlcs - DLCs, ediciones y expansiones
gamesRouter.get("/:id/dlcs", async (c) => {
  const id = c.req.param("id");
  const { page, page_size } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Game>>(
    `/games/${id}/additions`,
    { page, page_size },
  );
  return c.json(data);
});

// GET /api/games/:id/series - Juegos de la misma saga
gamesRouter.get("/:id/series", async (c) => {
  const id = c.req.param("id");
  const { page, page_size } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Game>>(
    `/games/${id}/game-series`,
    { page, page_size },
  );
  return c.json(data);
});

// GET /api/games/:id/parent - Juego padre (para DLCs)
gamesRouter.get("/:id/parent", async (c) => {
  const id = c.req.param("id");
  const { page, page_size } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Game>>(
    `/games/${id}/parent-games`,
    { page, page_size },
  );
  return c.json(data);
});

// GET /api/games/:id/team - Equipo de desarrollo
gamesRouter.get("/:id/team", async (c) => {
  const id = c.req.param("id");
  const { page, page_size, ordering } = c.req.query();
  const data = await rawg.get<PaginatedResponse<Creator>>(
    `/games/${id}/development-team`,
    { page, page_size, ordering },
  );
  return c.json(data);
});

// GET /api/games/:id/reddit - Posts de Reddit relacionados
gamesRouter.get("/:id/reddit", async (c) => {
  const id = c.req.param("id");
  const data = await rawg.get<PaginatedResponse<RedditPost>>(`/games/${id}/reddit`);
  return c.json(data);
});
