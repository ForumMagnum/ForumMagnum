import express from "express";
import { z } from "zod";
import { getContextFromReqAndRes } from "./vulcan-lib";
import { sendMessagesToLlm } from "./languageModels/llmApiWrapper";
import { htmlToMarkdown } from "./editor/conversionUtils";
import type { Express } from "express";

const commentSchema = z.object({
  originalText: z.string(),
  comment: z.string(),
});

const genericEditSchema = z.object({
  originalText: z.string().describe('The original text which you are providing a suggested edit for.  Must match the original text exactly, except for escaping quotes when necessary, so that it can be parsed with JSON.parse.'),
  reasoning: z.string().optional().describe('A scratchpad for reasoning about the ideal edit.  This will not be shown to the user.  May be omitted if the edit is obvious.'),
  suggestedEdit: z.string().describe('The suggested edit to the original text.  This will be shown to the user.  Remember to escape any quotes in the suggested edit which might cause JSON parsing issues.'),
});

const suggestedEditsToolSchema = z.object({
  reasoning: z.string(),
  edits: z.array(genericEditSchema).describe('An array of suggested edits to the post.'),
  comments: z.array(commentSchema).describe('An array of comments on specific snippets of text in the post.'),
}).describe(`A tool which shows users suggested edits to their post, as well as comments on specific snippets of text.  Each edit should include the original text and the suggested edit (new text, in full).  The original text must be an exact match of the displayed text in the post (which is not the same as the markdown representation that you will see), except for escaping quotes when necessary, so that it can be parsed with JSON.parse.  Do not include any suggested edits for pieces of text that contain links, footnotes, or other non-plain-text elements that might cause issues during a find-and-replace operation.  Comments should be used in cases where the appropriate edit is not obvious, such as cases where the original text is ambiguous or difficult to understand.  Do not leave comments that indicate that no edit is needed.  In general, lean to only leaving comments in cases where there is an obvious issue with the text that needs to be addressed, or if the user has explicitly asked for a specific kind of feedback in the prompt.`);

export function addFeedbackEndpoint(app: Express) {
  app.use("/api/getLlmFeedback", express.json());
  app.post("/api/getLlmFeedback", async (req, res) => {
    const context = await getContextFromReqAndRes({ req, res, isSSR: false });
    const currentUser = context.currentUser;

    if (!currentUser || !currentUser.isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { content, prompt } = req.body;

    const markdown = htmlToMarkdown(content);

    const response = await sendMessagesToLlm({
      provider: 'anthropic',
      maxTokens: 8096,
      model: 'claude-3-5-sonnet-20241022',
      zodParser: suggestedEditsToolSchema,
      name: 'suggestedEdits',
      messages: [{
        role: 'user',
        content: `${prompt}\n\n<Post>${markdown}</Post>`
      }],
    });

    if (!response) {
      return res.status(200).json({
        edits: [],
        comments: [],
      });
    }

    return res.status(200).json(response);
  });
}
