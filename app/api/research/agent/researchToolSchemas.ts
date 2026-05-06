import { z } from "zod";
import { insertLocationSchema } from "../../agent/toolSchemas";

/**
 * Schemas for the research-agent edit endpoints. Mirror the Posts-side
 * `toolSchemas.ts` but drop fields that don't apply (`postId`, `key`,
 * `agentName`, `mode`):
 *  - `postId` is replaced by `documentId` (a ResearchDocument's `_id`)
 *  - link-sharing-key auth is replaced by sandbox-callback bearer token
 *    (in the `Authorization` header, not the body)
 *  - `agentName` becomes implicit — provenance is captured via
 *    `conversationId` from the bearer token, not a free-form name
 *  - `mode` is dropped — research docs don't have a suggest/accept review
 *    surface; agent edits land directly. Provenance is preserved via the
 *    `producedByConversationId` node attribute.
 */

export const replaceTextInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  quote: z.string().describe("The text to find and replace"),
  replacement: z.string().describe("The replacement text in markdown"),
});

export const insertBlockInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  location: insertLocationSchema,
  markdown: z.string().describe("The markdown content to insert"),
});

export const deleteBlockInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  prefix: z.string().describe("Delete the first block whose markdown starts with this text"),
});

export const insertLLMBlockInResearchDocSchema = z.object({
  documentId: z.string().describe("The ID of the ResearchDocument"),
  modelName: z.string().default("AI Agent").describe("Model name to display on the LLM content block"),
  markdown: z.string().describe("The markdown content for the LLM content block"),
  location: insertLocationSchema,
});
