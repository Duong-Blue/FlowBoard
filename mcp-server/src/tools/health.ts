import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FlowBoardApiClient } from "../client/flowboard-api.client.js";
import { AuthContext } from "../auth/auth-context.js";

export function registerHealthTool(server: Server, apiClient: FlowBoardApiClient, authContext: AuthContext) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "health",
        description: "Check the health of the FlowBoard API.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "health") {
      try {
        const result = await apiClient.request<{ status: string }>("/health");
        
        const authStatus: any = {
          isAuthenticated: authContext.isAuthenticated,
        };
        
        if (authContext.isAuthenticated) {
          authStatus.user = authContext.getUser();
        } else {
          authStatus.error = authContext.getError();
        }

        const fullResult = {
          ...result,
          authentication: authStatus
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(fullResult, null, 2),
            },
          ],
        };
      } catch (error) {
         return {
          content: [
            {
              type: "text",
              text: `Health check failed: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }
    
    throw new Error(`Tool not found: ${request.params.name}`);
  });
}
