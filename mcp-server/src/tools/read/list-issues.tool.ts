import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FlowBoardApiClient } from "../../client/flowboard-api.client.js";
import { AuthContext } from "../../auth/auth-context.js";
import { IssuesAdapter, IssueQueryDto } from "../../client/adapters/issues.adapter.js";
import { FlowBoardApiError } from "../../client/flowboard-api.errors.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ListIssuesInputSchema = z.object({
  projectId: z.string().uuid(),
  search: z.string().optional(),
  status: z.string().optional(),
  workflowStatusId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  overdue: z.boolean().optional(),
  dueSoon: z.boolean().optional(),
  noDueDate: z.boolean().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export function registerListIssuesTool(server: Server, apiClient: FlowBoardApiClient, authContext: AuthContext) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_issues",
        description: "List issues in a project with optional filtering and pagination.",
        inputSchema: zodToJsonSchema(ListIssuesInputSchema as any) as any,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "list_issues") {
      if (!authContext.isAuthenticated) {
        return {
          content: [
            {
              type: "text",
              text: "Authentication required to use list_issues tool.",
            },
          ],
          isError: true,
        };
      }

      try {
        const args = request.params.arguments;
        // Parse and validate arguments, treating them as untrusted
        const validatedArgs = ListIssuesInputSchema.parse(args);
        const { projectId, ...queryArgs } = validatedArgs;

        const adapter = new IssuesAdapter(apiClient);
        const result = await adapter.list(projectId, queryArgs as IssueQueryDto);

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
                text: `List issues API failed: ${error.message} (Status: ${error.status})`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `List issues failed: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
  });
}
