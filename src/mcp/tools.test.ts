import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock del cliente RAWG — debe declararse antes de cualquier import que use rawg
vi.mock("../rawg/client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../rawg/client.js")>();
  return { ...actual, rawg: { get: vi.fn() } };
});

import { rawg } from "../rawg/client.js";
import { handleTool, MCP_TOOLS } from "./tools.js";

const EXPECTED_TOOL_NAMES = [
  "search_games",
  "get_game_details",
  "get_game_achievements",
  "get_game_trailers",
  "get_game_screenshots",
  "get_game_stores",
  "get_game_dlcs",
  "get_game_series",
  "get_game_team",
  "get_game_reddit",
  "list_genres",
  "list_platforms",
  "list_creators",
  "get_developer_games",
  "get_publisher_games",
];

// ─── MCP_TOOLS — estructura ──────────────────────────────────────────────────

describe("MCP_TOOLS", () => {
  it("contiene exactamente las herramientas esperadas", () => {
    const names = MCP_TOOLS.map((t) => t.name);
    expect(names.sort()).toEqual([...EXPECTED_TOOL_NAMES].sort());
  });

  it("cada herramienta tiene name, description e inputSchema válidos", () => {
    for (const tool of MCP_TOOLS) {
      expect(tool.name, `${tool.name}: falta name`).toBeTruthy();
      expect(tool.description, `${tool.name}: falta description`).toBeTruthy();
      expect(tool.inputSchema, `${tool.name}: falta inputSchema`).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("las herramientas que requieren id lo marcan como required", () => {
    const toolsWithRequiredId = [
      "get_game_details",
      "get_game_achievements",
      "get_game_trailers",
      "get_game_screenshots",
      "get_game_stores",
      "get_game_dlcs",
      "get_game_series",
      "get_game_team",
      "get_game_reddit",
      "get_developer_games",
      "get_publisher_games",
    ];

    for (const name of toolsWithRequiredId) {
      const tool = MCP_TOOLS.find((t) => t.name === name)!;
      expect(
        (tool.inputSchema as { required?: string[] }).required,
        `${name}: debería tener required: ['id']`,
      ).toContain("id");
    }
  });

  it("las herramientas de listado no tienen parámetros required", () => {
    const listTools = ["search_games", "list_genres", "list_platforms", "list_creators"];
    for (const name of listTools) {
      const tool = MCP_TOOLS.find((t) => t.name === name)!;
      const required = (tool.inputSchema as { required?: string[] }).required;
      expect(required ?? [], `${name}: no debería tener required`).toHaveLength(0);
    }
  });
});

// ─── handleTool — formato de respuesta ──────────────────────────────────────

describe("handleTool", () => {
  const mockList = { count: 2, next: null, previous: null, results: [{ id: 1 }, { id: 2 }] };

  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue(mockList);
  });

  it("devuelve content array con un elemento de tipo text", async () => {
    const result = await handleTool("search_games", { search: "zelda" });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
  });

  it("el texto es el resultado serializado como JSON", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce(mockList);

    const result = await handleTool("search_games", {});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed).toEqual(mockList);
  });

  it("lanza error para herramienta desconocida", async () => {
    await expect(handleTool("herramienta_inexistente", {})).rejects.toThrow(
      "Herramienta desconocida: herramienta_inexistente",
    );
  });
});

// ─── handleTool — validación Zod ─────────────────────────────────────────────

describe("handleTool — validación de argumentos con Zod", () => {
  it("lanza ZodError si id contiene path traversal", async () => {
    await expect(handleTool("get_game_details", { id: "../../etc/passwd" })).rejects.toThrow();
  });

  it("lanza ZodError si id está vacío", async () => {
    await expect(handleTool("get_game_details", { id: "" })).rejects.toThrow();
  });

  it("lanza ZodError si id es un objeto (no string)", async () => {
    await expect(handleTool("get_game_details", { id: { toString: () => "injected" } })).rejects.toThrow();
  });

  it("lanza ZodError si page_size supera 40 en search_games", async () => {
    await expect(handleTool("search_games", { page_size: 999 })).rejects.toThrow();
  });

  it("lanza ZodError si dates tiene formato incorrecto", async () => {
    await expect(handleTool("search_games", { dates: "not-a-date" })).rejects.toThrow();
  });

  it("lanza ZodError si ordering es un valor arbitrario en search_games", async () => {
    await expect(handleTool("search_games", { ordering: "hack;DROP TABLE" })).rejects.toThrow();
  });

  it("lanza ZodError si se pasan campos extra en search_games (strict mode)", async () => {
    await expect(handleTool("search_games", { unknown_key: "value" })).rejects.toThrow();
  });

  it("acepta id válido con guiones y números", async () => {
    vi.mocked(rawg.get).mockResolvedValueOnce({});
    await expect(handleTool("get_game_details", { id: "the-witcher-3-wild-hunt" })).resolves.not.toThrow();
  });
});

// ─── handleTool — dispatch de cada herramienta ──────────────────────────────

describe("handleTool — rutas al cliente RAWG", () => {
  beforeEach(() => {
    vi.mocked(rawg.get).mockResolvedValue({ count: 0, results: [] });
  });

  it("search_games llama a /games con los parámetros recibidos", async () => {
    await handleTool("search_games", { search: "mario", page: 2 });
    expect(rawg.get).toHaveBeenCalledWith("/games", { search: "mario", page: 2 });
  });

  it("get_game_details llama a /games/:id", async () => {
    await handleTool("get_game_details", { id: "3498" });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498");
  });

  it("get_game_achievements llama a /games/:id/achievements", async () => {
    await handleTool("get_game_achievements", { id: "3498", page: 1 });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/achievements", { page: 1 });
  });

  it("get_game_trailers llama a /games/:id/movies", async () => {
    await handleTool("get_game_trailers", { id: "the-witcher-3-wild-hunt" });
    expect(rawg.get).toHaveBeenCalledWith("/games/the-witcher-3-wild-hunt/movies");
  });

  it("get_game_screenshots llama a /games/:id/screenshots", async () => {
    await handleTool("get_game_screenshots", { id: "3498", page_size: 10 });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/screenshots", { page_size: 10 });
  });

  it("get_game_stores llama a /games/:id/stores", async () => {
    await handleTool("get_game_stores", { id: "3498" });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/stores");
  });

  it("get_game_dlcs llama a /games/:id/additions", async () => {
    await handleTool("get_game_dlcs", { id: "3498" });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/additions", {});
  });

  it("get_game_series llama a /games/:id/game-series", async () => {
    await handleTool("get_game_series", { id: "3498" });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/game-series", {});
  });

  it("get_game_team llama a /games/:id/development-team", async () => {
    await handleTool("get_game_team", { id: "3498" });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/development-team", {});
  });

  it("get_game_reddit llama a /games/:id/reddit", async () => {
    await handleTool("get_game_reddit", { id: "3498" });
    expect(rawg.get).toHaveBeenCalledWith("/games/3498/reddit");
  });

  it("list_genres llama a /genres", async () => {
    await handleTool("list_genres", { page: 1 });
    expect(rawg.get).toHaveBeenCalledWith("/genres", { page: 1 });
  });

  it("list_platforms llama a /platforms", async () => {
    await handleTool("list_platforms", {});
    expect(rawg.get).toHaveBeenCalledWith("/platforms", {});
  });

  it("list_creators llama a /creators", async () => {
    await handleTool("list_creators", {});
    expect(rawg.get).toHaveBeenCalledWith("/creators", {});
  });

  it("get_developer_games llama a /developers/:id", async () => {
    await handleTool("get_developer_games", { id: "cd-projekt-red" });
    expect(rawg.get).toHaveBeenCalledWith("/developers/cd-projekt-red");
  });

  it("get_publisher_games llama a /publishers/:id", async () => {
    await handleTool("get_publisher_games", { id: "electronic-arts" });
    expect(rawg.get).toHaveBeenCalledWith("/publishers/electronic-arts");
  });
});
