import { generateText, Output, stepCountIs } from "ai";
import { z } from "zod";
import {
  loadAiDigestPostCandidatesByIds,
  type AiDigestCandidatePool,
  type AiDigestPostCandidate,
  type AiDigestQuickTakeCandidate,
} from "./aiDigestCandidates";
import type { AiDigestHistory } from "./aiDigestHistory";
import {
  aiDigestGatewayProviderOptions,
  aiDigestModelCallRecord,
  aiDigestUserMessage,
  decodeStrayUnicodeEscapes,
} from "./aiDigestModelCalls";
import { AI_DIGEST_POST_SELECTION_PROMPT_VERSION, buildAiDigestPostSelectionPrompt } from "./aiDigestPostSelectionPrompt";
import type { AiDigestReaderProfile } from "./aiDigestReaderProfile";
import {
  AI_DIGEST_SELECTION_STEP_LIMIT,
  createAiDigestSelectionTools,
  isSelectableAiDigestSearchResult,
} from "./aiDigestSelectionTools";

export const AI_DIGEST_SELECTION_MODEL_ID = "anthropic/claude-fable-5.1";
const MAX_QUICK_TAKES_PER_ISSUE = 2;

const reasonSchema = z.string().min(1).max(180).describe(
  "The true reason this item was chosen for this reader, e.g. \"Because you "
  + "follow author X\" or an honest inferred-interest match. Fall back to the "
  + "site-wide rationale (e.g. one of the most appreciated posts this week) only "
  + "when reader signals are too thin to ground any connection. Never describe "
  + "what the item is about, including in a clause appended after a dash or colon.",
);

const selectionOutputSchema = z.object({
  headlinePosts: z.array(z.object({ postId: z.string(), reason: reasonSchema })).length(2),
  otherItems: z.array(z.object({ itemId: z.string(), reason: reasonSchema })).length(3),
  subject: z.string().min(1).max(120),
  preheader: z.string().min(1).max(180),
  aiNote: z.array(z.string().min(1).max(380)).min(1).max(3),
});

type AiDigestPostSelectionOutput = z.infer<typeof selectionOutputSchema>;

type AiDigestSelectedItem =
  | { documentType: "post"; post: AiDigestPostCandidate; reason: string }
  | { documentType: "quickTake"; quickTake: AiDigestQuickTakeCandidate; reason: string };

export interface AiDigestPostSelection {
  items: AiDigestSelectedItem[];
  subject: string;
  preheader: string;
  aiNote: string[];
  call: AiDigestModelCallRecord;
}

/**
 * The model's five picks as candidates. Picks the model found by search are
 * checked against the same eligibility rules as the candidates it was given.
 */
async function resolveSelectedItems({ output, pool, history, user, context }: {
  output: AiDigestPostSelectionOutput;
  pool: AiDigestCandidatePool<AiDigestPostCandidate>;
  history: AiDigestHistory;
  user: DbUser;
  context: ResolverContext;
}): Promise<AiDigestSelectedItem[]> {
  const selections = [
    ...output.headlinePosts.map(({ postId, reason }) => ({ itemId: postId, reason, isHeadline: true })),
    ...output.otherItems.map(({ itemId, reason }) => ({ itemId, reason, isHeadline: false })),
  ];
  if (new Set(selections.map(({ itemId }) => itemId)).size !== selections.length) {
    throw new Error("Selection must contain five distinct items");
  }
  const postsById = new Map(pool.posts.map((post) => [post.postId, post]));
  const quickTakesById = new Map(pool.quickTakes.map((quickTake) => [quickTake.commentId, quickTake]));
  const searchResultIds = selections
    .map(({ itemId }) => itemId)
    .filter((itemId) => !postsById.has(itemId) && !quickTakesById.has(itemId));
  const searchResults = await loadAiDigestPostCandidatesByIds(user, context, searchResultIds, history.previousInclusions);
  for (const post of searchResults) {
    if (isSelectableAiDigestSearchResult(post, pool.repeatsAllowed)) {
      postsById.set(post.postId, post);
    }
  }

  const items = selections.map(({ itemId, reason, isHeadline }): AiDigestSelectedItem => {
    const post = postsById.get(itemId);
    if (post) {
      return { documentType: "post", post, reason: decodeStrayUnicodeEscapes(reason) };
    }
    const quickTake = quickTakesById.get(itemId);
    if (quickTake && !isHeadline) {
      return { documentType: "quickTake", quickTake, reason: decodeStrayUnicodeEscapes(reason) };
    }
    throw new Error(`Selection referenced an unknown or ineligible item for its slot: ${itemId}`);
  });
  if (items.filter((item) => item.documentType === "quickTake").length > MAX_QUICK_TAKES_PER_ISSUE) {
    throw new Error(`Selection may include at most ${MAX_QUICK_TAKES_PER_ISSUE} quick takes`);
  }
  return items;
}

export async function selectAiDigestPosts({ user, context, profile, pool, history, personalInstructions, asOf }: {
  user: DbUser;
  context: ResolverContext;
  profile: AiDigestReaderProfile;
  pool: AiDigestCandidatePool<AiDigestPostCandidate & { summary: string }>;
  history: AiDigestHistory;
  personalInstructions: string | null;
  asOf: Date;
}): Promise<AiDigestPostSelection> {
  const { system, prompt } = buildAiDigestPostSelectionPrompt({
    profile,
    posts: pool.posts,
    quickTakes: pool.quickTakes,
    history,
    personalInstructions,
    asOf,
  });
  const result = await generateText({
    model: AI_DIGEST_SELECTION_MODEL_ID,
    system,
    messages: [aiDigestUserMessage(prompt, AI_DIGEST_SELECTION_MODEL_ID)],
    tools: createAiDigestSelectionTools({
      user,
      context,
      candidatePostIds: new Set(pool.posts.map((post) => post.postId)),
      previousInclusions: history.previousInclusions,
      repeatsAllowed: pool.repeatsAllowed,
      asOf,
    }),
    stopWhen: stepCountIs(AI_DIGEST_SELECTION_STEP_LIMIT),
    providerOptions: aiDigestGatewayProviderOptions("post-selection"),
    output: Output.object({
      schema: selectionOutputSchema,
      name: "aiDigestPostSelection",
      description: "A ranked five-item LessWrong digest selection of posts and optional quick takes.",
    }),
    maxOutputTokens: 12_000,
  });
  if (result.finishReason !== "stop") {
    throw new Error(
      `AI digest selection stopped with finish reason ${result.finishReason} after `
      + `${result.totalUsage.outputTokens ?? 0} output tokens`,
    );
  }
  return {
    items: await resolveSelectedItems({ output: result.output, pool, history, user, context }),
    subject: decodeStrayUnicodeEscapes(result.output.subject),
    preheader: decodeStrayUnicodeEscapes(result.output.preheader),
    aiNote: result.output.aiNote.map(decodeStrayUnicodeEscapes),
    call: aiDigestModelCallRecord({
      purpose: "post-selection",
      modelId: AI_DIGEST_SELECTION_MODEL_ID,
      promptVersion: AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
      system,
      prompt,
      result,
    }),
  };
}
