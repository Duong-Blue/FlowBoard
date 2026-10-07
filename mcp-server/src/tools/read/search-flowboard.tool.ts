import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FlowBoardApiClient } from "../../client/flowboard-api.client.js";
import { AuthContext } from "../../auth/auth-context.js";
import { SearchAdapter, SearchQuery } from "../../client/adapters/search.adapter.js";
import { FlowBoardApiError } from "../../client/flowboard-api.errors.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const SearchQuerySchema = z.object({
  q: z.string().optional(),
  orgId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  type: z.enum(["ISSUE", "PROJECT", "USER"]).optional().default("ISSUE"),
  workflowStatusId: z.string().uuid().optional(),
  statusCategory: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  issueType: z.enum(['BUG', 'FEATURE', 'TASK', 'SUBTASK', 'EPIC']).optional(),
  assigneeId: z.string().uuid().optional(),
  reporterId: z.string().uuid().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
  sortBy: z.enum(['relevance', 'createdAt', 'updatedAt', 'priority', 'dueDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export function registerSearchFlowboardTool(server: Server, apiClient: FlowBoardApiClient, authContext: AuthContext) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "search_flowboard",
        description: "Search across issues, projects, and users in FlowBoard.",
        inputSchema: zodToJsonSchema(SearchQuerySchema as any) as any,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "search_flowboard") {
      if (!authContext.isAuthenticated) {
        return {
          content: [
            {
              type: "text",
              text: "Authentication required to use search_flowboard tool.",
            },
          ],
          isError: true,
        };
      }

      try {
        const query = request.params.arguments as unknown as SearchQuery;
        // Parse and validate query data, treating it as untrusted
        const validatedQuery = SearchQuerySchema.parse(query);

        const adapter = new SearchAdapter(apiClient);
        const result = await adapter.search(validatedQuery as SearchQuery);

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
                text: `Search API failed: ${error.message} (Status: ${error.status})`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Search failed: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
  });
}
