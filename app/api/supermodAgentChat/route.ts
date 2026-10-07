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

// Anthropic prompt-caching breakpoints: tokens before a breakpoint whose
// bytes match a recent request cost ~10% of normal input price. The 1h TTL
// (2x one-time write vs 1.25x for 5m) goes only on the tools+system block,
// which is byte-stable across all users and sessions, so one cache entry
// serves every moderator's chats all day. Per-user context and transcript
// stay at 5m: the agent's own writes and moderator actions mutate them, so
// cross-hour byte-identity is unlikely and the premium would buy misses.
// Anthropic requires longer-TTL breakpoints to precede shorter ones; the
// system message comes first, so this ordering is fixed.
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

/**
 * The system prompt is editable by moderators: ModerationLoreDocs with scope
 * "systemPrompt" (managed at /admin/moderationLore) replace the built-in base
 * prompt when present. The generated step vocabulary is always appended so it
 * can't drift from the code.
 */
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
  // Agent chats are shared between moderators: any admin/mod may continue any
  // conversation (the mod-gate above covers this). conversation.userId records
  // who started it; tool writes attribute to whoever is currently chatting.
  if (conversation.targetUserId !== targetUserId) {
    return new Response('Conversation is scoped to a different user', { status: 400 });
  }

  const bindings = {
    conversationId,
    model,
    defaultTargetUserId: targetUserId,
  };

  // Preload the user's full moderation context server-side (the same bundle
  // the MCP get_full_user_context tool serves). Deliberately NOT the rest of
  // the review queue. Per-element errors are embedded in the bundle rather
  // than failing the request.
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
      // The context message carries its own breakpoint so the whole stable
      // prefix (tools + system prompt + context) caches as one unit. When the
      // target user's data changes mid-conversation the dossier bytes change
      // and everything from here on is a cache miss — that's the fresh-data
      // tradeoff, not a bug. The tool outputs contain no request-varying
      // timestamps, so between turns of an active session the bytes match.
      { role: 'system' as const, content: contextMessage, providerOptions: anthropicCacheBreakpoint },
      ...await convertToModelMessages(messages),
    ],
    // A moving breakpoint on each step's final message caches the growing
    // transcript incrementally — both across user turns and across the (up
    // to 16) internal tool-loop steps, which is where most input tokens go.
    // Together with the two breakpoints above this stays within Anthropic's
    // limit of 4.
    prepareStep: ({ messages: stepMessages }) => ({ messages: withTrailingCacheBreakpoint(stepMessages) }),
    // Everything the agent should read is preloaded into the context message;
    // the one read tool is the escape hatch for bodies truncated at the
    // per-item word limit. The MCP mount still exposes the full read set.
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
