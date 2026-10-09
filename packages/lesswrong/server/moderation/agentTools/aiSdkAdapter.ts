import { tool, ToolSet } from "ai";
import type { ModerationAgentTool, ModerationAgentToolBindings } from "./types";

export function toAiSdkTools(
  tools: ModerationAgentTool[],
  context: ResolverContext,
  bindings: ModerationAgentToolBindings,
): ToolSet {
  const toolSet: ToolSet = {};
  for (const agentTool of tools) {
    toolSet[agentTool.name] = tool({
      description: agentTool.description,
      inputSchema: agentTool.inputSchema,
      execute: async (args: unknown) => {
        try {
          return await agentTool.execute(args, context, bindings);
        } catch (error) {
          // Return errors as tool results so the model can correct course
          // instead of aborting the stream.
          return JSON.stringify({ error: error instanceof Error ? error.message : "Tool execution failed" });
        }
      },
    });
  }
  return toolSet;
}
