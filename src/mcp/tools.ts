import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { rawg } from "../rawg/client.js";
import type {
  Achievement,
  Creator,
  Developer,
  Game,
  GameDetails,
  GameStore,
  Genre,
  PaginatedResponse,
  Platform,
  Publisher,
  RedditPost,
  Screenshot,
  Trailer,
} from "../rawg/types.js";

// ─── Schemas Zod reutilizables ────────────────────────────────────────────────

const IdSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/, "id must be an alphanumeric slug or numeric id"),
});

const PaginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(40).optional(),
});

const SearchGamesSchema = z.object({
  search: z.string().max(500).optional(),
  genres: z.string().max(200).optional(),
  platforms: z.string().max(200).optional(),
  developers: z.string().max(200).optional(),
  publishers: z.string().max(200).optional(),
  tags: z.string().max(200).optional(),
  dates: z.string().regex(/^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/).optional(),
  metacritic: z.string().regex(/^\d{1,3},\d{1,3}$/).optional(),
  ordering: z.enum([
    "name", "-name", "released", "-released", "added", "-added",
    "rating", "-rating", "metacritic", "-metacritic",
  ]).optional(),
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(40).optional(),
}).strict();

const CatalogListSchema = PaginationSchema.extend({
  ordering: z.string().max(50).optional(),
}).strict();

// ─── Definiciones de herramientas ────────────────────────────────────────────

export const MCP_TOOLS: Tool[] = [
  {
    name: "search_games",
    description:
      "Busca videojuegos en la base de datos de RAWG.io. Permite filtrar por nombre, géneros, plataformas, fechas de lanzamiento y puntuación Metacritic. Devuelve listados paginados con información básica de cada juego.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Texto de búsqueda (nombre del juego)",
        },
        genres: {
          type: "string",
          description: "IDs o slugs de géneros separados por comas (ej: 'action,rpg' o '4,5')",
        },
        platforms: {
          type: "string",
          description: "IDs de plataformas separados por comas (ej: '4,5' para PC y PS4)",
        },
        dates: {
          type: "string",
          description: "Rango de fechas de lanzamiento en formato 'YYYY-MM-DD,YYYY-MM-DD'",
        },
        metacritic: {
          type: "string",
          description: "Rango de puntuación Metacritic (ej: '80,100' para los mejores juegos)",
        },
        ordering: {
          type: "string",
          description: "Ordenar por: 'name', '-rating', '-metacritic', '-released', '-added'. El guión indica orden descendente.",
        },
        page: {
          type: "number",
          description: "Número de página (por defecto 1)",
        },
        page_size: {
          type: "number",
          description: "Resultados por página, máximo 40 (por defecto 20)",
        },
      },
    },
  },
  {
    name: "get_game_details",
    description:
      "Obtiene todos los detalles de un videojuego específico: descripción completa, historia, fecha de lanzamiento, plataformas, géneros, desarrolladores, publicadores, puntuaciones (Metacritic y rating de usuarios), clasificación ESRB, tiempo de juego estimado y más.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID numérico o slug del juego (ej: 'the-witcher-3-wild-hunt' o '3498')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_achievements",
    description:
      "Obtiene la lista de logros/trofeos de un videojuego con su nombre, descripción, imagen y porcentaje de jugadores que lo han conseguido.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug del juego" },
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_trailers",
    description:
      "Obtiene los tráilers y videos oficiales de un videojuego con URLs de previsualización y video completo.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug del juego" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_screenshots",
    description:
      "Obtiene capturas de pantalla oficiales de un videojuego con URLs de imágenes en alta resolución.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug del juego" },
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_stores",
    description:
      "Obtiene los enlaces a las tiendas donde se puede comprar el juego (Steam, GOG, PlayStation Store, Xbox Store, Epic Games, etc.) con sus URLs directas.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug del juego" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_dlcs",
    description:
      "Obtiene la lista de DLCs, expansiones, ediciones especiales (GOTY, Gold Edition, etc.) y aplicaciones complementarias de un videojuego.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug del juego principal" },
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_series",
    description:
      "Obtiene otros videojuegos que forman parte de la misma saga o serie (ej: todos los juegos de la saga 'The Witcher' o 'Dark Souls').",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug de cualquier juego de la saga" },
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_team",
    description:
      "Obtiene el equipo de desarrollo de un videojuego: directores, diseñadores, programadores, artistas, músicos y otros creadores individuales que participaron en su desarrollo.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug del juego" },
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_game_reddit",
    description:
      "Obtiene los posts más recientes de Reddit relacionados con el juego desde su subreddit oficial, incluyendo título, texto, imagen y URL.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID numérico o slug del juego" },
      },
      required: ["id"],
    },
  },
  {
    name: "list_genres",
    description:
      "Lista todos los géneros de videojuegos disponibles en RAWG (Action, RPG, Strategy, Shooter, etc.) con el número de juegos en cada género.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
        ordering: { type: "string", description: "Ordenar por: 'name', '-games_count'" },
      },
    },
  },
  {
    name: "list_platforms",
    description:
      "Lista todas las plataformas de videojuegos disponibles en RAWG (PC, PlayStation, Xbox, Nintendo Switch, etc.) con el número de juegos disponibles en cada una.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
        ordering: { type: "string", description: "Ordenar por: 'name', '-games_count'" },
      },
    },
  },
  {
    name: "list_creators",
    description:
      "Lista creadores individuales de videojuegos (directores, diseñadores, músicos, etc.) con sus posiciones y juegos en los que han trabajado.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Número de página" },
        page_size: { type: "number", description: "Resultados por página (máximo 40)" },
      },
    },
  },
  {
    name: "get_developer_games",
    description:
      "Obtiene información detallada de una desarrolladora de videojuegos (descripción, número de juegos) y sus juegos más destacados.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID numérico o slug de la desarrolladora (ej: 'cd-projekt-red' o '4062')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_publisher_games",
    description:
      "Obtiene información detallada de una publicadora de videojuegos (descripción, número de juegos) y sus juegos más destacados.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID numérico o slug de la publicadora (ej: 'electronic-arts' o '109')",
        },
      },
      required: ["id"],
    },
  },
];

// ─── Handler principal ────────────────────────────────────────────────────────

type Args = Record<string, unknown>;

export async function handleTool(
  name: string,
  args: Args,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const result = await executeTool(name, args);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

// ─── Dispatch con validación Zod ─────────────────────────────────────────────

async function executeTool(name: string, args: Args): Promise<unknown> {
  switch (name) {
    case "search_games": {
      const params = SearchGamesSchema.parse(args);
      return rawg.get<PaginatedResponse<Game>>("/games", params);
    }

    case "get_game_details": {
      const { id } = IdSchema.parse(args);
      return rawg.get<GameDetails>(`/games/${id}`);
    }

    case "get_game_achievements": {
      const { id, ...rest } = IdSchema.merge(PaginationSchema).parse(args);
      return rawg.get<PaginatedResponse<Achievement>>(`/games/${id}/achievements`, rest);
    }

    case "get_game_trailers": {
      const { id } = IdSchema.parse(args);
      return rawg.get<PaginatedResponse<Trailer>>(`/games/${id}/movies`);
    }

    case "get_game_screenshots": {
      const { id, ...rest } = IdSchema.merge(PaginationSchema).parse(args);
      return rawg.get<PaginatedResponse<Screenshot>>(`/games/${id}/screenshots`, rest);
    }

    case "get_game_stores": {
      const { id } = IdSchema.parse(args);
      return rawg.get<PaginatedResponse<GameStore>>(`/games/${id}/stores`);
    }

    case "get_game_dlcs": {
      const { id, ...rest } = IdSchema.merge(PaginationSchema).parse(args);
      return rawg.get<PaginatedResponse<Game>>(`/games/${id}/additions`, rest);
    }

    case "get_game_series": {
      const { id, ...rest } = IdSchema.merge(PaginationSchema).parse(args);
      return rawg.get<PaginatedResponse<Game>>(`/games/${id}/game-series`, rest);
    }

    case "get_game_team": {
      const { id, ...rest } = IdSchema.merge(PaginationSchema).parse(args);
      return rawg.get<PaginatedResponse<Creator>>(`/games/${id}/development-team`, rest);
    }

    case "get_game_reddit": {
      const { id } = IdSchema.parse(args);
      return rawg.get<PaginatedResponse<RedditPost>>(`/games/${id}/reddit`);
    }

    case "list_genres": {
      const params = CatalogListSchema.parse(args);
      return rawg.get<PaginatedResponse<Genre>>("/genres", params);
    }

    case "list_platforms": {
      const params = CatalogListSchema.parse(args);
      return rawg.get<PaginatedResponse<Platform>>("/platforms", params);
    }

    case "list_creators": {
      const params = PaginationSchema.parse(args);
      return rawg.get<PaginatedResponse<Creator>>("/creators", params);
    }

    case "get_developer_games": {
      const { id } = IdSchema.parse(args);
      return rawg.get<Developer>(`/developers/${id}`);
    }

    case "get_publisher_games": {
      const { id } = IdSchema.parse(args);
      return rawg.get<Publisher>(`/publishers/${id}`);
    }

    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}
