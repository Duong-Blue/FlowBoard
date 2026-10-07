import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FlowBoardApiClient } from "../../client/flowboard-api.client.js";
import { AuthContext } from "../../auth/auth-context.js";
import { IssuesAdapter } from "../../client/adapters/issues.adapter.js";
import { FlowBoardApiError } from "../../client/flowboard-api.errors.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const GetIssueArgsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format").describe("The UUID of the project"),
  issueId: z.string().uuid("Invalid issue ID format").describe("The UUID of the issue"),
});

export function registerGetIssueTool(server: Server, apiClient: FlowBoardApiClient, authContext: AuthContext) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_issue",
        description: "Get a specific issue by its ID within a project.",
        inputSchema: zodToJsonSchema(GetIssueArgsSchema as any) as any,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_issue") {
      if (!authContext.isAuthenticated) {
        return {
          content: [
            {
              type: "text",
              text: "Authentication required to use get_issue tool.",
            },
          ],
          isError: true,
        };
      }

      try {
        const args = request.params.arguments;
        // Parse and validate query data, treating it as untrusted
        const validatedArgs = GetIssueArgsSchema.parse(args);

        const adapter = new IssuesAdapter(apiClient);
        const result = await adapter.get(validatedArgs.projectId, validatedArgs.issueId);

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
              text: `Failed to get issue: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
  });
}
