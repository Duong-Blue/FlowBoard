import { describe, it, expect, vi } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { FlowBoardApiClient } from "../../client/flowboard-api.client.js";
import { AuthContext } from "../../auth/auth-context.js";
import {
  registerSearchFlowboardTool,
  registerGetProjectTool,
  registerListIssuesTool,
  registerGetIssueTool,
  registerListRoadmapItemsTool,
} from "./index.js";

describe("Read Tools Registration", () => {
  it("should register all read tools without errors", () => {
    const server = new Server({ name: "test", version: "1.0.0" }, { capabilities: { tools: {} } });
    const apiClient = new FlowBoardApiClient("http://localhost:3000", () => "token");
    const authContext = new AuthContext(apiClient);

    server.setRequestHandler = vi.fn();

    expect(() => registerSearchFlowboardTool(server, apiClient, authContext)).not.toThrow();
    expect(() => registerGetProjectTool(server, apiClient, authContext)).not.toThrow();
    expect(() => registerListIssuesTool(server, apiClient, authContext)).not.toThrow();
    expect(() => registerGetIssueTool(server, apiClient, authContext)).not.toThrow();
    expect(() => registerListRoadmapItemsTool(server, apiClient, authContext)).not.toThrow();
  });
});
