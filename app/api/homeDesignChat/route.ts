import { streamText, generateText, UIMessage, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import { HOME_DESIGN_SHARED_PROMPT } from "@/lib/homeDesignPrompt";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { NextRequest } from "next/server";

async function generateDesignTitle(
  messages: UIMessage[],
): Promise<string> {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.parts.filter((p) => p.type === 'text').map((p) => p.text).join(' '))
    .join('\n');

  try {
    const result = await generateText({
      model: 'anthropic/claude-haiku-4-5-20251001',
      system: 'Generate a short title (3-6 words, no quotes) for a home page design based on the user\'s request. Respond with ONLY the title, nothing else.',
      prompt: userMessages,
      maxOutputTokens: 30,
    });
    const title = result.text.trim();
    return title || 'Untitled Design';
  } catch {
    return 'Untitled Design';
  }
}

const SYSTEM_PROMPT = `You are a home page designer for LessWrong, a discussion forum about rationality and AI safety. Users describe their ideal home page and you build it as **body content only** that runs inside a sandboxed iframe.
${HOME_DESIGN_SHARED_PROMPT}

When the user asks you to apply, preview, or submit a design, call the submitHomePageDesign tool with the body content. Always call this tool proactively after creating or modifying a design — don't just show code, apply it.`;

export async function POST(req: NextRequest) {
  const { messages, publicId: clientPublicId }: { messages: UIMessage[], publicId?: string } = await req.json();

  const currentUser = await getUserFromReq(req);
  const clientId = req.cookies.get('clientId')?.value ?? null;
  const ownerId = currentUser?._id ?? clientId;

  let publicId = clientPublicId ?? null;
  let latestRecordId: string | null = null;

  // NOTE: Model switching for OpenAI models (e.g. 'openai/gpt-5.4') to be implemented.
  // All gateway model IDs use the 'provider/model' format.
  const modelId = 'anthropic/claude-sonnet-4-6';
  const result = streamText({
    model: modelId,
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

          // For existing designs, check ownership and reuse the title
          let existingTitle: string | null = null;
          if (publicId) {
            const original = await HomePageDesigns.findOne(
              { publicId },
              { sort: { createdAt: 1 } },
              { ownerId: 1, title: 1 },
            );
            if (!original || original.ownerId !== ownerId) {
              return { success: true, message: 'Design applied (not saved — ownership mismatch).', publicId };
            }
            existingTitle = original.title;
          }

          const newId = await HomePageDesigns.rawInsert({
            ownerId,
            publicId: publicId ?? "",
            html,
            title: existingTitle ?? "Untitled Design",
            source: "internal",
            modelName: modelId,
            conversationHistory: [], // Placeholder; updated with full conversation in onFinish
            verified: false,
            commentId: null,
            createdAt: new Date(),
            autoReviewPassed: false,
            autoReviewMessage: null,
          });
          latestRecordId = newId;

          const shortId = newId.substring(0, 4);

          if (!publicId) {
            await HomePageDesigns.rawUpdateOne(
              { _id: newId },
              { $set: { publicId: shortId } },
            );
            publicId = newId;

            // Generate a title in the background for new designs
            backgroundTask(generateDesignTitle(messages).then(
              (title) => HomePageDesigns.rawUpdateOne(
                { _id: newId },
                { $set: { title } },
              ),
            ));
          } else {
            // Clear conversation history from older revisions of this design,
            // since they are strict subsets of the latest and duplicate bulky
            // HTML from tool call inputs.
            backgroundTask(HomePageDesigns.rawUpdateMany(
              { publicId, _id: { $ne: newId } },
              { $set: { conversationHistory: [] } },
            ));
          }

          return { success: true, message: 'Design applied and saved.', publicId };
        },
      },
    },
    providerOptions: {
      openai: {
        reasoningEffort: 'medium',
      },
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 2048 },
      },
    },
    onFinish: (result) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result.usage, null, 2));
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages: allMessages }) => {
      if (latestRecordId) {
        backgroundTask(HomePageDesigns.rawUpdateOne(
          { _id: latestRecordId },
          { $set: { conversationHistory: allMessages } },
        ));
      }
    },
  });
}
