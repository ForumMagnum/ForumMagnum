import { z } from "zod";

export const replaceModeSchema = z.enum(["edit", "suggest"]);
export type ReplaceMode = z.infer<typeof replaceModeSchema>;

const modeSchema = replaceModeSchema.default("suggest").describe("Whether to apply directly ('edit') or as a suggestion ('suggest'). Defaults to 'suggest'.");

export const insertLocationSchema = z.union([
  z.literal("start"),
  z.literal("end"),
  z.object({ before: z.string().describe("Insert before the paragraph starting with this text") }),
  z.object({ after: z.string().describe("Insert after the paragraph starting with this text") }),
]).describe("Where to insert: 'start', 'end', { before: '...' }, or { after: '...' }");

export type InsertLocation = z.infer<typeof insertLocationSchema>;

export const commentOnDraftToolSchema = z.object({
  postId: z.string().describe("The ID of the post to comment on"),
  key: z.string().optional().describe("Link-sharing key for collaborative draft access"),
  agentName: z.string().optional().describe("Name to attribute the comment to"),
  quote: z.string().optional().describe("Text to attach the comment to (should be long enough to be unambiguous)"),
  comment: z.string().describe("The comment text in markdown"),
});

export const replaceTextToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  key: z.string().optional().describe("Optional link-sharing key for collaborative draft access"),
  agentName: z.string().optional().describe("Name to attribute suggestion threads to"),
  quote: z.string().describe("The text to find and replace"),
  replacement: z.string().describe("The replacement text in markdown"),
  mode: modeSchema,
});

export const replaceWidgetToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  key: z.string().optional().describe("Optional link-sharing key for collaborative draft access"),
  agentName: z.string().optional().describe("Name to attribute suggestion threads to"),
  widgetId: z.string().describe("The widget ID to update"),
  replacement: z.string().optional().describe("Full replacement widget content"),
  unifiedDiff: z.string().optional().describe("Unified diff to apply to current widget content"),
  mode: modeSchema,
});

/**
 * Validates that exactly one of `replacement` or `unifiedDiff` is provided.
 * Returns an error message string if validation fails, or null if valid.
 */
export function validateReplaceWidgetExclusivity(value: { replacement?: string, unifiedDiff?: string }): string | null {
  const operationCount = (typeof value.replacement === "string" ? 1 : 0) + (typeof value.unifiedDiff === "string" ? 1 : 0);
  if (operationCount !== 1) {
    return "Provide exactly one of replacement or unifiedDiff.";
  }
  return null;
}

export const replaceWidgetRouteSchema = replaceWidgetToolSchema.refine((value: { replacement?: string, unifiedDiff?: string }) => {
  return validateReplaceWidgetExclusivity(value) === null;
}, {
  message: "Provide exactly one of replacement or unifiedDiff",
  path: ["replacement"],
});

export const insertBlockToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  key: z.string().optional().describe("Optional link-sharing key for collaborative draft access"),
  agentName: z.string().optional().describe("Name to attribute suggestion threads to"),
  location: insertLocationSchema,
  markdown: z.string().describe("The markdown content to insert"),
  mode: modeSchema,
});

export const insertLLMBlockToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  key: z.string().optional().describe("Optional link-sharing key for collaborative draft access"),
  modelName: z.string().default("AI Agent").describe("The model name to display on the LLM content block (e.g. 'Claude Opus 4.7')"),
  markdown: z.string().describe("The markdown content for the LLM content block"),
  location: insertLocationSchema,
});

export const insertWidgetToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  key: z.string().optional().describe("Optional link-sharing key for collaborative draft access"),
  agentName: z.string().optional().describe("Name to attribute the widget insertion to"),
  content: z.string().describe("The raw HTML/JS content for the widget"),
  location: insertLocationSchema,
});

export const replyToCommentToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  key: z.string().optional().describe("Optional link-sharing key for collaborative draft access"),
  agentName: z.string().optional().describe("Name to attribute the reply to"),
  threadId: z.string().describe("The ID of the thread to reply to (from the Comment Threads section of the editPost response)"),
  comment: z.string().describe("The reply text in markdown"),
});

export const deleteBlockToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  key: z.string().optional().describe("Optional link-sharing key for collaborative draft access"),
  agentName: z.string().optional().describe("Name to attribute suggestion threads to"),
  prefix: z.string().describe("Delete the first block whose markdown starts with this text"),
  mode: modeSchema,
});
