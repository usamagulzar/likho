import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import packageJson from "../../../package.json";

import type { TokenScope } from "@/lib/tokens";
import { registerNoteTools } from "./tools";

export const MCP_INSTRUCTIONS =
  "Likho stores your personal notes as plain text that may include Markdown. Each note uses its first line as the title and the remaining lines as its body. Use the notes tools to list, search, read, create, edit, append, delete, and restore notes in the authenticated account.";

export function createLikhoServer(context: { userId: string; scopes: TokenScope[]; origin: string }): McpServer {
  const server = new McpServer(
    { name: "likho", version: packageJson.version },
    { instructions: MCP_INSTRUCTIONS },
  );
  registerNoteTools(server, context);
  return server;
}
