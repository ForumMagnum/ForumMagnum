import { supermodAgentStorageEnabledSetting } from "@/lib/instanceSettings";
import { streamText, generateText, stepCountIs, UIMessage, ModelMessage, convertToModelMessages } from 'ai';
import { NextRequest } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import ModerationAgentConversations from "@/server/collections/moderationAgentConversations/collection";
import ModerationLoreDocs from "@/server/collections/moderationLoreDocs/collection";
import { buildModerationContextForUser, readDocumentBodyTool } from "@/server/moderation/agentTools/readTools";
import { moderationWriteTools } from "@/server/moderation/agentTools/writeTools";
import { toAiSdkTools } from "@/server/moderation/agentTools/aiSdkAdapter";
import { SUPERMOD_AGENT_BASE_SYSTEM_PROMPT, renderStepVocabulary } from "@/lib/collections/moderationAgentConversations/agentSystemPrompt";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { defaultSupermodAgentModel, isSupportedSupermodAgentModel, supermodAgentModelSupportsThinking } from "@/lib/collections/moderationAgentConversations/agentModels";

const MAX_MESSAGES_PER_CONVERSATION = 200;

// The 1h cache TTL goes only on the tools+system block, which is byte-stable across all users and sessions.
// Anthropic requires longer-TTL breakpoints to precede shorter ones.
const anthropicCacheBreakpoint1h = { anthropic: { cacheControl: { type: 'ephemeral' as const, ttl: '1h' as const } } };
const anthropicCacheBreakpoint = { anthropic: { cacheControl: { type: 'ephemeral' as const } } };

function withTrailingCacheBreakpoint(messages: ModelMessage[]): ModelMessage[] {
  const last = messages[messages.length - 1];
  if (!last) return messages;
  return [
    ...messages.slice(0, -1),
    {
      ...last,
      providerOptions: {
        ...last.providerOptions,
        anthropic: { ...last.providerOptions?.anthropic, ...anthropicCacheBreakpoint.anthropic },
      },
    } as ModelMessage,
  ];
}

async function buildSystemPrompt(): Promise<string> {
  const systemPromptDocs = await ModerationLoreDocs.find(
    { scope: 'systemPrompt', deleted: false },
    { sort: { createdAt: 1 } },
  ).fetch();
  const basePrompt = systemPromptDocs.length
    ? systemPromptDocs.map((doc) => htmlToMarkdown(doc.contents?.html ?? '')).join('\n\n')
    : SUPERMOD_AGENT_BASE_SYSTEM_PROMPT;
  return `${basePrompt}\n\nAvailable proposal step types:\n${renderStepVocabulary()}`;
}

async function generateConversationTitle(messages: UIMessage[]): Promise<string> {
  const userMessages = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.parts.filter((part) => part.type === 'text').map((part) => part.text).join(' '))
    .join('\n');
  try {
    const result = await generateText({
      model: 'anthropic/claude-haiku-4-5',
      system: 'Generate a short title (3-6 words, no quotes) for a moderation discussion based on the moderator\'s messages. Respond with ONLY the title, nothing else.',
      prompt: userMessages.slice(0, 2000),
      maxOutputTokens: 30,
    });
    return result.text.trim() || 'Moderation discussion';
  } catch {
    return 'Moderation discussion';
  }
}

export async function POST(req: NextRequest) {
  const { messages, targetUserId, conversationId, model: requestedModel }: { messages: UIMessage[], targetUserId: string, conversationId: string, model?: string } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES_PER_CONVERSATION
    || typeof targetUserId !== 'string' || typeof conversationId !== 'string') {
    return new Response('Invalid request', { status: 400 });
  }
  const model = requestedModel ?? defaultSupermodAgentModel;
  if (!isSupportedSupermodAgentModel(model)) {
    return new Response('Unsupported model', { status: 400 });
  }

  const context = await getContextFromReqAndRes({ req, isSSR: false });
  const { currentUser } = context;
  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return new Response('Moderator access required', { status: 403 });
  }

  if (!supermodAgentStorageEnabledSetting.get(context)) {
    return new Response("Agent storage is unavailable on this instance", { status: 503 });
  }

  const conversation = await ModerationAgentConversations.findOne({ _id: conversationId });
  if (!conversation || conversation.deleted) {
    return new Response('Conversation not found', { status: 404 });
  }
  // Any moderator may continue any conversation; tool writes are attributed to whoever is chatting.
  if (conversation.targetUserId !== targetUserId) {
    return new Response('Conversation is scoped to a different user', { status: 400 });
  }

  const bindings = {
    conversationId,
    model,
    defaultTargetUserId: targetUserId,
  };

  const [contextBundle, systemPrompt] = await Promise.all([
    buildModerationContextForUser(targetUserId, context, bindings),
    buildSystemPrompt(),
  ]);

  const contextMessage = `Context for this session (fetched just now, current as of this turn):

${contextBundle}`;

  const result = streamText({
    model,
    system: { role: 'system', content: systemPrompt, providerOptions: anthropicCacheBreakpoint1h },
    messages: [
      { role: 'system' as const, content: contextMessage, providerOptions: anthropicCacheBreakpoint },
      ...await convertToModelMessages(messages),
    ],
    // With the two breakpoints above, this stays within Anthropic's limit of 4.
    prepareStep: ({ messages: stepMessages }) => ({ messages: withTrailingCacheBreakpoint(stepMessages) }),
    tools: toAiSdkTools([readDocumentBodyTool, ...moderationWriteTools], context, bindings),
    stopWhen: stepCountIs(16),
    ...(supermodAgentModelSupportsThinking(model) && {
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 2048 },
        },
      },
    }),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages: allMessages }) => {
      backgroundTask(ModerationAgentConversations.rawUpdateOne(
        { _id: conversationId },
        { $set: { messages: allMessages } },
      ));
      if (!conversation.title) {
        backgroundTask(generateConversationTitle(messages).then(
          (title) => ModerationAgentConversations.rawUpdateOne(
            { _id: conversationId },
            { $set: { title } },
          ),
        ));
      }
    },
  });
}
