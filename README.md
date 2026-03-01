# RAWG API

Wrapper sobre [RAWG.io](https://rawg.io) con dos modos de uso:

- **Servidor HTTP REST** — endpoints consumibles desde cualquier cliente
- **Servidor MCP (stdio)** — integración directa con Claude Desktop y otros clientes MCP

---

## Requisitos

- Node.js 18+
- API key de RAWG → [rawg.io/apidocs](https://rawg.io/apidocs)

## Instalación

```bash
npm install
```

Crea un fichero `.env` en la raíz:

```env
RAWG_API_KEY=tu_clave_aqui
PORT=3000
```

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor HTTP en modo desarrollo (tsx) |
| `npm run dev:mcp` | Servidor MCP en modo desarrollo (tsx) |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm start` | Servidor HTTP desde `dist/` |
| `npm run start:mcp` | Servidor MCP desde `dist/` |

---

## API HTTP

Base URL: `http://localhost:3000`

### Health check

```
GET /
```

Devuelve nombre, versión y listado de endpoints disponibles.

---

### Juegos — `/api/games`

#### Listar / buscar juegos

```
GET /api/games
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `search` | string | Búsqueda por nombre |
| `genres` | string | IDs o slugs separados por coma (`action,rpg`) |
| `platforms` | string | IDs de plataformas separados por coma (`4,5`) |
| `developers` | string | IDs o slugs de desarrolladoras |
| `publishers` | string | IDs o slugs de publicadoras |
| `tags` | string | IDs o slugs de tags |
| `dates` | string | Rango de fechas (`2020-01-01,2023-12-31`) |
| `metacritic` | string | Rango de puntuación (`80,100`) |
| `ordering` | string | `name`, `-rating`, `-metacritic`, `-released`, `-added` |
| `page` | number | Número de página (defecto: 1) |
| `page_size` | number | Resultados por página, máx. 40 (defecto: 20) |
| `search_precise` | boolean | Búsqueda exacta |
| `exclude_additions` | boolean | Excluir DLCs |
| `exclude_parents` | boolean | Excluir juegos padre |
| `exclude_game_series` | boolean | Excluir sagas |

#### Detalles de un juego

```
GET /api/games/:id
```

`:id` puede ser el ID numérico o el slug (ej: `the-witcher-3-wild-hunt`).

Devuelve descripción completa, plataformas, géneros, desarrolladores, publicadores, puntuaciones Metacritic, clasificación ESRB, tiempo de juego y más.

#### Logros / Trofeos

```
GET /api/games/:id/achievements
```

| Parámetro | Descripción |
|---|---|
| `page`, `page_size` | Paginación |
| `ordering` | Ordenación |

#### Tráilers y videos

```
GET /api/games/:id/trailers
```

#### Capturas de pantalla

```
GET /api/games/:id/screenshots
```

#### Tiendas

```
GET /api/games/:id/stores
```

Devuelve links a Steam, GOG, PlayStation Store, Xbox, Epic Games, etc.

#### DLCs y expansiones

```
GET /api/games/:id/dlcs
```

#### Juegos de la misma saga

```
GET /api/games/:id/series
```

#### Juego padre (para DLCs)

```
GET /api/games/:id/parent
```

#### Equipo de desarrollo

```
GET /api/games/:id/team
```

Directores, diseñadores, programadores, artistas, músicos, etc.

#### Posts de Reddit

```
GET /api/games/:id/reddit
```

Posts del subreddit oficial del juego.

---

### Géneros — `/api/genres`

```
GET /api/genres                # Listar todos los géneros
GET /api/genres/:id            # Detalles de un género
```

Parámetros de lista: `page`, `page_size`, `ordering` (`name`, `-games_count`)

---

### Plataformas — `/api/platforms`

```
GET /api/platforms             # Listar todas las plataformas
GET /api/platforms/:id         # Detalles de una plataforma
```

Parámetros de lista: `page`, `page_size`, `ordering` (`name`, `-games_count`)

---

### Desarrolladoras — `/api/developers`

```
GET /api/developers            # Listar desarrolladoras
GET /api/developers/:id        # Detalles y juegos de una desarrolladora
```

`:id` puede ser el ID numérico o el slug (ej: `cd-projekt-red`)

---

### Publicadoras — `/api/publishers`

```
GET /api/publishers            # Listar publicadoras
GET /api/publishers/:id        # Detalles y juegos de una publicadora
```

`:id` puede ser el ID numérico o el slug (ej: `electronic-arts`)

---

### Creadores — `/api/creators`

```
GET /api/creators              # Listar creadores individuales
GET /api/creators/:id          # Detalles de un creador
```

Incluye directores, diseñadores, músicos y otros roles individuales.

---

### Tags — `/api/tags`

```
GET /api/tags                  # Listar todos los tags
GET /api/tags/:id              # Detalles de un tag
```

---

## Servidor MCP

El servidor MCP usa transporte **stdio** y es compatible con **Claude Desktop**.

### Configuración en Claude Desktop

Edita `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rawg-games": {
      "command": "node",
      "args": ["C:/ruta/al/proyecto/dist/mcp.js"],
      "env": {
        "RAWG_API_KEY": "tu_clave_aqui"
      }
    }
  }
}
```

Reinicia Claude Desktop. Las herramientas aparecerán disponibles automáticamente.

### Herramientas MCP disponibles

| Herramienta | Descripción |
|---|---|
| `search_games` | Buscar juegos con filtros (géneros, plataformas, fechas, Metacritic) |
| `get_game_details` | Detalles completos de un juego por ID o slug |
| `get_game_achievements` | Logros y trofeos de un juego |
| `get_game_trailers` | Tráilers y videos oficiales |
| `get_game_screenshots` | Capturas de pantalla en alta resolución |
| `get_game_stores` | Tiendas donde comprar el juego con URLs directas |
| `get_game_dlcs` | DLCs, expansiones y ediciones especiales |
| `get_game_series` | Otros juegos de la misma saga |
| `get_game_team` | Equipo de desarrollo (directores, artistas, etc.) |
| `get_game_reddit` | Posts de Reddit del subreddit oficial |
| `list_genres` | Listar todos los géneros disponibles |
| `list_platforms` | Listar todas las plataformas disponibles |
| `list_creators` | Listar creadores individuales |
| `get_developer_games` | Info y juegos de una desarrolladora |
| `get_publisher_games` | Info y juegos de una publicadora |

---

## Estructura del proyecto

```
src/
├── config.ts          # Variables de entorno y configuración
├── index.ts           # Servidor HTTP (Hono)
├── mcp.ts             # Servidor MCP (stdio)
├── rawg/
│   ├── client.ts      # Cliente HTTP para RAWG API
│   └── types.ts       # Tipos TypeScript
├── mcp/
│   └── tools.ts       # Definición y handlers de herramientas MCP
└── routes/
    ├── games.ts
    ├── genres.ts
    ├── platforms.ts
    ├── developers.ts
    ├── publishers.ts
    ├── creators.ts
    └── tags.ts
```

---

## Respuestas paginadas

La mayoría de endpoints de lista devuelven esta estructura:

```json
{
  "count": 500000,
  "next": "http://localhost:3000/api/games?page=2",
  "previous": null,
  "results": [...]
}
```

## Errores

| Código | Descripción |
|---|---|
| `400` | Parámetros inválidos |
| `404` | Recurso no encontrado |
| `429` | Rate limit de RAWG alcanzado |
| `500` | Error interno del servidor |

```json
{
  "error": "Descripción del error",
  "rawg_status": 404
}
```
