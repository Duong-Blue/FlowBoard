import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ENV } from "./config/config.js";
import { FlowBoardApiClient } from "./client/flowboard-api.client.js";
import { AuthContext } from "./auth/auth-context.js";
import { registerHealthTool } from "./tools/health.js";
import {
  registerSearchFlowboardTool,
  registerGetProjectTool,
  registerListIssuesTool,
  registerGetIssueTool,
  registerListRoadmapItemsTool,
} from "./tools/read/index.js";

async function main() {
  const apiClient = new FlowBoardApiClient(ENV.FLOWBOARD_API_URL, () => ENV.FLOWBOARD_API_TOKEN);
  const authContext = new AuthContext(apiClient);
  await authContext.initialize();

  if (!authContext.isAuthenticated) {
    console.error("Warning: Starting unauthenticated. " + authContext.getError());
  }

  const server = new Server(
    {
      name: "flowboard-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  registerHealthTool(server, apiClient, authContext);
  registerSearchFlowboardTool(server, apiClient, authContext);
  registerGetProjectTool(server, apiClient, authContext);
  registerListIssuesTool(server, apiClient, authContext);
  registerGetIssueTool(server, apiClient, authContext);
  registerListRoadmapItemsTool(server, apiClient, authContext);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FlowBoard MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
