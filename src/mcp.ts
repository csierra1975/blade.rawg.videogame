import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import "./config.js"; // Carga y valida la configuración (falla si no hay API key)
import { RawgError } from "./rawg/client.js";
import { handleTool, MCP_TOOLS } from "./mcp/tools.js";

const server = new Server(
  {
    name: "rawg-games-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ─── Listar herramientas disponibles ─────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: MCP_TOOLS };
});

// ─── Ejecutar herramienta ────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    return await handleTool(name, (args ?? {}) as Record<string, unknown>);
  } catch (err) {
    if (err instanceof RawgError) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Error de RAWG API (${err.status}): ${err.message}`,
          },
        ],
      };
    }
    if (err instanceof Error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: err.message }],
      };
    }
    return {
      isError: true,
      content: [{ type: "text" as const, text: "Error desconocido" }],
    };
  }
});

// ─── Arrancar servidor MCP ────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("rawg-games-mcp server arrancado (stdio)");
}

main().catch((err) => {
  console.error("Error fatal en MCP server:", err);
  process.exit(1);
});
