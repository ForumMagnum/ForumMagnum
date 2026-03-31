import { streamText, UIMessage, convertToModelMessages } from 'ai';
// eslint-disable-next-line no-restricted-imports
import { createOpenAI, OpenAIChatLanguageModelOptions } from '@ai-sdk/openai';
import { z } from 'zod';
import { openAIApiKey } from '@/server/databaseSettings';
import { anthropicApiKey } from "@/lib/instanceSettings";
import { AnthropicLanguageModelOptions, createAnthropic } from '@ai-sdk/anthropic';
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import { HOME_DESIGN_SHARED_PROMPT } from "@/lib/homeDesignPrompt";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are a home page designer for LessWrong, a discussion forum about rationality and AI safety. Users describe their ideal home page and you build it as **body content only** that runs inside a sandboxed iframe.
${HOME_DESIGN_SHARED_PROMPT}

When the user asks you to apply, preview, or submit a design, call the submitHomePageDesign tool with the body content. Always call this tool proactively after creating or modifying a design — don't just show code, apply it.`;

export async function POST(req: NextRequest) {
  const { messages, publicId: clientPublicId }: { messages: UIMessage[], publicId?: string } = await req.json();

  const openAiApiKey = openAIApiKey.get();
  if (!openAiApiKey) {
    return new Response('OpenAI API key not configured', { status: 500 });
  }

  const anthropicKey = anthropicApiKey.get();

  const currentUser = await getUserFromReq(req);
  const clientId = req.cookies.get('clientId')?.value ?? null;
  const ownerId = currentUser?._id ?? clientId;

  const openai = createOpenAI({ apiKey: openAiApiKey });
  const anthropic = createAnthropic({ apiKey: anthropicKey });

  let publicId = clientPublicId ?? null;

  const modelId = 'claude-sonnet-4-6';
  const result = streamText({
    // model: openai('gpt-5.4'),
    // model: anthropic('claude-haiku-4-5-20251001'),
    model: anthropic(modelId),
    system: { role: 'system', content: SYSTEM_PROMPT, providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } },
    messages: await convertToModelMessages(messages),
    tools: {
      submitHomePageDesign: {
        description: 'Apply a home page design to the iframe. Call this whenever you create or modify a design. The html parameter should be body content only (styles, divs, scripts) — NOT a full HTML document.',
        inputSchema: z.object({
          html: z.string().describe('Body content: <style> tags, HTML elements, and <script type="text/babel"> tags. Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags — the wrapper handles those. React, ReactDOM, Babel, and the RPC bridge are already loaded.'),
        }),
        execute: async ({ html }) => {
          if (!ownerId) {
            return { success: true, message: 'Design applied (not saved — no identity).', publicId: null };
          }

          if (publicId) {
            const original = await HomePageDesigns.findOne(
              { publicId },
              { sort: { createdAt: 1 } },
              { ownerId: 1 },
            );
            if (!original || original.ownerId !== ownerId) {
              return { success: true, message: 'Design applied (not saved — ownership mismatch).', publicId };
            }
          }

          const newId = await HomePageDesigns.rawInsert({
            ownerId,
            publicId: publicId ?? "",
            html,
            title: "Untitled Design",
            source: "internal",
            modelName: modelId,
            conversationHistory: messages,
            verified: false,
            commentId: null,
            createdAt: new Date(),
          });

          const shortId = newId.substring(0, 4);

          if (!publicId) {
            await HomePageDesigns.rawUpdateOne(
              { _id: newId },
              { $set: { publicId: shortId } },
            );
            publicId = newId;
          }

          return { success: true, message: 'Design applied and saved.', publicId };
        },
      },
    },
    providerOptions: {
      openai: {
        reasoningEffort: 'medium',
      } satisfies OpenAIChatLanguageModelOptions,
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 2048, },
      } satisfies AnthropicLanguageModelOptions,
    },
    onFinish: (result) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result.usage, null, 2));
    },
  });

  return result.toUIMessageStreamResponse();
}
