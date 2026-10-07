import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FlowBoardApiClient } from "../../client/flowboard-api.client.js";
import { AuthContext } from "../../auth/auth-context.js";
import { MilestonesAdapter } from "../../client/adapters/milestones.adapter.js";
import { FlowBoardApiError } from "../../client/flowboard-api.errors.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ListRoadmapItemsSchema = z.object({
  projectId: z.string().uuid({ message: "projectId must be a valid UUID" }),
});

export function registerListRoadmapItemsTool(server: Server, apiClient: FlowBoardApiClient, authContext: AuthContext) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_roadmap_items",
        description: "List roadmap items (milestones) for a project in FlowBoard.",
        inputSchema: zodToJsonSchema(ListRoadmapItemsSchema as any) as any,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "list_roadmap_items") {
      if (!authContext.isAuthenticated) {
        return {
          content: [
            {
              type: "text",
              text: "Authentication required to use list_roadmap_items tool.",
            },
          ],
          isError: true,
        };
      }

      try {
        const validatedArgs = ListRoadmapItemsSchema.parse(request.params.arguments);

        const adapter = new MilestonesAdapter(apiClient);
        const result = await adapter.list(validatedArgs.projectId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid arguments: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        if (error instanceof FlowBoardApiError) {
          return {
            content: [
              {
                type: "text",
                text: `API failed: ${error.message} (Status: ${error.status})`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Request failed: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
  });
}
