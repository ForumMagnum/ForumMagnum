import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { generateText, tool } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { anthropicApiKey } from "@/lib/instanceSettings";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.llmStreaming;

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

const requestBodySchema = z.object({
  content: z.string(),
  prompt: z.string(),
});

export async function POST(req: NextRequest) {
  const context = await getContextFromReqAndRes({ req, isSSR: false });
  const currentUser = context.currentUser;

  if (!userIsAdmin(currentUser)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parseResult = requestBodySchema.safeParse(body);
  
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }
  
  const { content, prompt } = parseResult.data;

  const markdown = htmlToMarkdown(content);

  const apiKey = anthropicApiKey.get();
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
  }

  const anthropic = createAnthropic({ apiKey });

  const result = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    prompt: `${prompt}\n\n<Post>${markdown}</Post>`,
    tools: {
      suggestedEdits: tool({
        description: suggestedEditsToolSchema.description,
        inputSchema: suggestedEditsToolSchema,
      }),
    },
    toolChoice: {
      type: 'tool',
      toolName: 'suggestedEdits',
    },
  });

  const toolCall = result.toolCalls[0];
  if (!toolCall || toolCall.toolName !== 'suggestedEdits') {
    return NextResponse.json({
      edits: [],
      comments: [],
    });
  }

  return NextResponse.json(toolCall.input);
}
