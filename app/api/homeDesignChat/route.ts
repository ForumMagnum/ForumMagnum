import { streamText, generateText, UIMessage, convertToModelMessages, LanguageModel } from 'ai';
import { z } from 'zod';
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import { ClientIds } from "@/server/collections/clientIds/collection";
import { HOME_PAGE_DESIGN_PUBLIC_ID_LENGTH } from "@/lib/collections/homePageDesigns/constants";
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

  if (!ownerId) {
    return new Response('No identity found. Please log in or enable cookies.', { status: 401 });
  }

  // For logged-out users, verify the clientId exists and is at least 10 seconds old
  if (!currentUser && clientId) {
    const clientIdRecord = await ClientIds.findOne({ clientId });
    const minAge = 10 * 1000;
    if (!clientIdRecord || (Date.now() - clientIdRecord.createdAt.getTime()) < minAge) {
      return new Response('Rate limit exceeded.', { status: 429 });
    }
  }

  // Rate limits: logged-out users get 3 messages / 3 internal designs,
  // logged-in users get 8 messages / 10 internal designs.
  const messageLimit = currentUser ? 8 : 3;
  const designLimit = currentUser ? 10 : 3;

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  if (userMessageCount > messageLimit) {
    const suggestion = currentUser
      ? 'You\'ve reached your message limit for this conversation. Start a new conversation to continue designing.'
      : 'Message limit reached. Please log in to continue designing.';
    return new Response(suggestion, { status: 429 });
  }

  // Only enforce the design limit when starting a new conversation (no publicId yet).
  // Iterating on an existing design is always allowed.
  if (!clientPublicId) {
    const internalDesigns = await HomePageDesigns.find(
      { ownerId, source: 'internal' },
      { projection: { publicId: 1 } },
    ).fetch();
    const distinctDesignCount = new Set(internalDesigns.map((d) => d.publicId)).size;

    if (distinctDesignCount >= designLimit) {
      const suggestion = currentUser
        ? 'You\'ve reached your design limit. You can still iterate on existing designs, or use your own agent.'
        : 'Design limit reached. Please log in to create more designs, or use your own agent.';
      return new Response(suggestion, { status: 429 });
    }
  }

  let publicId = clientPublicId ?? null;
  let latestRecordId: string | null = null;

  // For existing designs, verify ownership before calling the model
  let existingTitle: string | null = null;
  if (publicId) {
    const original = await HomePageDesigns.findOne(
      { publicId },
      { sort: { createdAt: 1 } },
      { ownerId: 1, title: 1 },
    );
    if (!original || original.ownerId !== ownerId) {
      return new Response('Design not found or ownership mismatch.', { status: 403 });
    }
    existingTitle = original.title;
  }

  // Publish-eligible users (not banned, and either reviewed or legacy account) get Sonnet
  const publishCutoffDate = new Date("2026-04-01T07:00:00.000Z");
  const canPublish = currentUser
    && !currentUser.banned
    && (currentUser.reviewedByUserId || currentUser.createdAt < publishCutoffDate);
    
  const modelId: LanguageModel = canPublish
    ? 'anthropic/claude-sonnet-4-6'
    : 'google/gemini-3-flash';

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
            autoReviewPassed: null,
            autoReviewMessage: null,
          });

          latestRecordId = newId;

          const shortId = newId.substring(0, HOME_PAGE_DESIGN_PUBLIC_ID_LENGTH);

          if (!publicId) {
            await HomePageDesigns.rawUpdateOne(
              { _id: newId },
              { $set: { publicId: shortId } },
            );
            publicId = shortId;

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
