import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FlowBoardApiClient } from "../../client/flowboard-api.client.js";
import { AuthContext } from "../../auth/auth-context.js";
import { ProjectsAdapter } from "../../client/adapters/projects.adapter.js";
import { FlowBoardApiError } from "../../client/flowboard-api.errors.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const GetProjectArgsSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID format"),
  projectId: z.string().uuid("Invalid project ID format"),
});

export function registerGetProjectTool(server: Server, apiClient: FlowBoardApiClient, authContext: AuthContext) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_project",
        description: "Get a specific project by organization ID and project ID.",
        inputSchema: zodToJsonSchema(GetProjectArgsSchema as any) as any,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_project") {
      if (!authContext.isAuthenticated) {
        return {
          content: [
            {
              type: "text",
              text: "Authentication required to use get_project tool.",
            },
          ],
          isError: true,
        };
      }

      try {
        const args = request.params.arguments;
        const validatedArgs = GetProjectArgsSchema.parse(args);

        const adapter = new ProjectsAdapter(apiClient);
        const result = await adapter.get(validatedArgs.orgId, validatedArgs.projectId);

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
              text: `Failed: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
  });
}
