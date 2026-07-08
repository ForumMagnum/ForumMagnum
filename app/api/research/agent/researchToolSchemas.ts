import { z } from "zod";
import { insertLocationSchema, replaceModeSchema, validateReplaceWidgetExclusivity } from "../../agent/toolSchemas";

/**
 * Schemas for the research-agent edit endpoints. Mirror the Posts-side
 * `toolSchemas.ts` but drop fields that don't apply (`postId`, `key`,
 * `agentName`):
 *  - `postId` is replaced by `documentId` (a ResearchDocument's `_id`)
 *  - link-sharing-key auth is replaced by sandbox-callback bearer token
 *    (in the `Authorization` header, not the body)
 *  - `agentName` becomes implicit — provenance is captured via
 *    `conversationId` from the bearer token, not a free-form name
 *  - `mode` defaults to `edit` (the opposite of the Posts default): the
 *    `/query` → AgentBlock workflow is built around edits landing live,
 *    with per-block `producedByConversationId` provenance. Suggest mode is
 *    opt-in, for edits the user should review before they stick.
 */

const researchModeSchema = replaceModeSchema
  .default("edit")
  .describe("Whether to apply directly ('edit') or as a tracked suggestion the user reviews in the editor ('suggest'). Defaults to 'edit'.");

export const replaceTextInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  quote: z.string().describe("The text to find and replace"),
  replacement: z.string().describe("The replacement text in markdown"),
  mode: researchModeSchema,
});

export const insertBlockInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  location: insertLocationSchema,
  markdown: z.string().describe("The markdown content to insert"),
  mode: researchModeSchema,
});

export const deleteBlockInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  prefix: z.string().describe("Delete the first block whose markdown starts with this text"),
  mode: researchModeSchema,
});

export const insertLLMBlockInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  modelName: z.string().default("AI Agent").describe("Model name to display on the LLM content block"),
  markdown: z.string().describe("The markdown content for the LLM content block"),
  location: insertLocationSchema,
});

export const insertWidgetInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  content: z.string().describe("The raw HTML/JS content for the widget"),
  location: insertLocationSchema,
});

export const replaceWidgetInResearchDocSchema = z
  .object({
    documentId: z.string().describe("The ID of the ResearchDocument"),
    widgetId: z.string().describe("The widget ID to update"),
    replacement: z.string().optional().describe("Full replacement widget content"),
    unifiedDiff: z.string().optional().describe("Unified diff to apply to current widget content"),
    mode: researchModeSchema,
  })
  .refine((value) => validateReplaceWidgetExclusivity(value) === null, {
    message: "Provide exactly one of replacement or unifiedDiff",
    path: ["replacement"],
  });

export const setConversationPresentationSchema = z.object({
  markdown: z
    .string()
    .max(32_000)
    .nullable()
    .describe(
      "Markdown for the conversation block's collapsed presentation; null clears it (falling back to the last assistant message)",
    ),
});

export const commentOnResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  quote: z.string().optional().describe("Text to attach the comment to (should be long enough to be unambiguous); omit for a top-level comment"),
  comment: z.string().describe("The comment text in markdown"),
});

export const replyToResearchDocCommentSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  threadId: z.string().describe("The ID of the thread to reply to (from the Comment Threads section of fetch-doc output)"),
  comment: z.string().describe("The reply text in markdown"),
});

export const execInSandboxSchema = z.object({
  cmd: z.string().min(1).max(4096).describe("Executable to run (e.g. 'sh', 'ps', 'pkill', 'kill')"),
  args: z.array(z.string().max(8192)).max(256).optional().describe("Arguments to pass to cmd"),
  cwd: z.string().max(4096).optional().describe("Working directory; defaults to the sandbox home"),
  sudo: z.boolean().optional().describe("Run the command as root"),
  timeoutMs: z
    .number()
    .int()
    .positive()
    .max(300_000)
    .optional()
    .describe("Abort the command after this many milliseconds (default 60000, max 300000)"),
  resumeIfStopped: z
    .boolean()
    .optional()
    .describe(
      "If the sandbox is stopped, resume it from its snapshot to run the command. Off by default: a stopped sandbox has no live process to inspect or kill, and resuming boots a fresh session.",
    ),
});

export const createResearchDocSchema = z.object({
  title: z
    .string()
    .max(500)
    .nullish()
    .transform((t) => {
      if (t == null) return null;
      const trimmed = t.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .describe("Optional title for the new document; empty/whitespace becomes null"),
  initialMarkdown: z
    .string()
    .max(64_000)
    .optional()
    .describe("Optional markdown to insert as initial content at the start of the new document"),
});
