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
  agentName: z.string().optional().describe("Name to attribute the comment to"),
  quote: z.string().optional().describe("Text to attach the comment to (should be long enough to be unambiguous)"),
  comment: z.string().describe("The comment text in markdown"),
});

export const commentOnDraftRouteSchema = commentOnDraftToolSchema.extend({
  key: z.string().optional(),
  paragraphId: z.string().optional(),
});

export const replaceTextToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  agentName: z.string().optional().describe("Name to attribute suggestion threads to"),
  quote: z.string().describe("The text to find and replace"),
  replacement: z.string().describe("The replacement text in markdown"),
  mode: modeSchema,
});

export const replaceTextRouteSchema = replaceTextToolSchema.extend({
  key: z.string().optional(),
});

export const replaceWidgetToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  agentName: z.string().optional().describe("Name to attribute suggestion threads to"),
  widgetId: z.string().describe("The widget ID to update"),
  replacement: z.string().optional().describe("Full replacement widget content"),
  unifiedDiff: z.string().optional().describe("Unified diff to apply to current widget content"),
  mode: modeSchema,
});

export const replaceWidgetRouteSchema = replaceWidgetToolSchema.extend({
  key: z.string().optional(),
}).refine((value: { replacement?: string, unifiedDiff?: string }) => {
  return (value.replacement ? 1 : 0) + (value.unifiedDiff ? 1 : 0) === 1;
}, {
  message: "Provide exactly one of replacement or unifiedDiff",
  path: ["replacement"],
});

export const insertBlockToolSchema = z.object({
  postId: z.string().describe("The ID of the post"),
  agentName: z.string().optional().describe("Name to attribute suggestion threads to"),
  location: insertLocationSchema,
  markdown: z.string().describe("The markdown content to insert"),
  mode: modeSchema,
});

export const insertBlockRouteSchema = insertBlockToolSchema.extend({
  key: z.string().optional(),
});
