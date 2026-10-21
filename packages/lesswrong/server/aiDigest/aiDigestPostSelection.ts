import { generateText, NoObjectGeneratedError, Output, stepCountIs, type ToolSet } from "ai";
import { z } from "zod";
import type { AiDigestPostCandidate, AiDigestQuickTakeCandidate } from "./aiDigestCandidates";
import type { AiDigestPastRecommendation } from "./aiDigestHistory";
import {
  AI_DIGEST_MODEL_ID,
  aiDigestGatewayProviderOptions,
  aiDigestModelCallRecord,
  aiDigestUserMessage,
  assertAiDigestModelFinished,
  decodeStrayUnicodeEscapes,
} from "./aiDigestModelCalls";
import {
  AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
  AI_DIGEST_SELECTION_STEP_LIMIT,
  buildAiDigestPostSelectionPrompt,
} from "./aiDigestPostSelectionPrompt";
import type { AiDigestSummarizedPost } from "./aiDigestPostSummaries";
import type { AiDigestReaderProfile } from "./aiDigestReaderProfile";
import {
  createAiDigestSelectionTools,
  loadSelectableAiDigestPosts,
  type AiDigestSelectionScope,
} from "./aiDigestSelectionTools";

const MAX_QUICK_TAKES_PER_ISSUE = 2;

const reasonSchema = z.string().min(1).max(180).describe(
  "The true reason this item was chosen for this reader, e.g. \"Because you "
  + "follow author X\" or an honest inferred-interest match. Fall back to the "
  + "site-wide rationale (e.g. one of the most appreciated posts this week) only "
  + "when reader signals are too thin to ground any connection. Never describe "
  + "what the item is about, including in a clause appended after a dash or colon.",
);

const selectionOutputSchema = z.object({
  subject: z.string().min(1).max(120).describe("The email subject line, led by the first headline post."),
  preheader: z.string().min(1).max(180).describe(
    "Content-bearing preview text shown after the subject in the reader's inbox.",
  ),
  aiNote: z.array(z.string().min(1).max(380)).min(1).max(3).describe(
    "One to three short paragraphs for the reader explaining the useful themes behind the slate, "
    + "or a specific connection to their reading, as described in the instructions.",
  ),
  headlinePosts: z.array(z.object({ postId: z.string(), reason: reasonSchema })).length(2),
  otherItems: z.array(z.object({ itemId: z.string(), reason: reasonSchema })).length(3),
});

type AiDigestSelectionOutput = z.infer<typeof selectionOutputSchema>;

export interface AiDigestSelectedPost {
  documentType: "post";
  post: AiDigestPostCandidate;
  reason: string;
}

interface AiDigestSelectedQuickTake {
  documentType: "quickTake";
  quickTake: AiDigestQuickTakeCandidate;
  reason: string;
}

export type AiDigestSelectedItem = AiDigestSelectedPost | AiDigestSelectedQuickTake;

export interface AiDigestPostSelection {
  subject: string;
  preheader: string;
  aiNote: string[];
  headlinePosts: AiDigestSelectedPost[];
  otherItems: AiDigestSelectedItem[];
  call: AiDigestModelCallRecord;
}

function callSelectionModel({ system, prompt, tools }: { system: string; prompt: string; tools: ToolSet }) {
  return generateText({
    model: AI_DIGEST_MODEL_ID,
    system,
    messages: [aiDigestUserMessage(prompt)],
    tools,
    stopWhen: stepCountIs(AI_DIGEST_SELECTION_STEP_LIMIT),
    providerOptions: aiDigestGatewayProviderOptions("post-selection"),
    output: Output.object({
      schema: selectionOutputSchema,
      name: "aiDigestPostSelection",
      description: "A ranked five-item LessWrong digest selection of posts and optional quick takes.",
    }),
    maxOutputTokens: 12_000,
  });
}

/**
 * The model occasionally returns output that doesn't match the schema, such as
 * empty copy fields. One retry, which rereads the prompt from the cache, is
 * cheaper than failing the issue.
 */
async function callSelectionModelRetryingInvalidOutput(request: { system: string; prompt: string; tools: ToolSet }) {
  try {
    return await callSelectionModel(request);
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error)) {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.warn("AI digest post selection output didn't match the schema; retrying", error.text);
    return await callSelectionModel(request);
  }
}

function selectedItem(
  itemId: string,
  reason: string,
  postsById: Map<string, AiDigestPostCandidate>,
  quickTakesById: Map<string, AiDigestQuickTakeCandidate>,
): AiDigestSelectedItem {
  const post = postsById.get(itemId);
  if (post) {
    return { documentType: "post", post, reason: decodeStrayUnicodeEscapes(reason) };
  }
  const quickTake = quickTakesById.get(itemId);
  if (quickTake) {
    return { documentType: "quickTake", quickTake, reason: decodeStrayUnicodeEscapes(reason) };
  }
  throw new Error(`AI digest selection picked an unknown or ineligible item: ${itemId}`);
}

export function isSelectedPost(item: AiDigestSelectedItem): item is AiDigestSelectedPost {
  return item.documentType === "post";
}

async function resolveSelectedItems(
  output: AiDigestSelectionOutput,
  scope: AiDigestSelectionScope,
  candidatePosts: AiDigestPostCandidate[],
  candidateQuickTakes: AiDigestQuickTakeCandidate[],
): Promise<Pick<AiDigestPostSelection, "headlinePosts" | "otherItems">> {
  const pickedIds = [...output.headlinePosts.map(({ postId }) => postId), ...output.otherItems.map(({ itemId }) => itemId)];
  if (new Set(pickedIds).size !== pickedIds.length) {
    throw new Error("AI digest selection picked the same item twice");
  }
  const postsById = new Map(candidatePosts.map((post) => [post.postId, post]));
  const quickTakesById = new Map(candidateQuickTakes.map((quickTake) => [quickTake.commentId, quickTake]));
  const searchFoundIds = pickedIds.filter((itemId) => !postsById.has(itemId) && !quickTakesById.has(itemId));
  for (const post of await loadSelectableAiDigestPosts(scope, searchFoundIds)) {
    postsById.set(post.postId, post);
  }

  const headlineItems = output.headlinePosts.map(({ postId, reason }) => selectedItem(postId, reason, postsById, quickTakesById));
  const headlinePosts = headlineItems.filter(isSelectedPost);
  if (headlinePosts.length !== headlineItems.length) {
    throw new Error("AI digest selection picked a quick take as a headline");
  }
  const otherItems = output.otherItems.map(({ itemId, reason }) => selectedItem(itemId, reason, postsById, quickTakesById));
  if (otherItems.filter((item) => item.documentType === "quickTake").length > MAX_QUICK_TAKES_PER_ISSUE) {
    throw new Error(`AI digest selection picked more than ${MAX_QUICK_TAKES_PER_ISSUE} quick takes`);
  }
  return { headlinePosts, otherItems };
}

export async function selectAiDigestPosts({ scope, profile, posts, quickTakes, pastRecommendations, personalInstructions }: {
  scope: AiDigestSelectionScope;
  profile: AiDigestReaderProfile;
  posts: AiDigestSummarizedPost[];
  quickTakes: AiDigestQuickTakeCandidate[];
  pastRecommendations: AiDigestPastRecommendation[];
  personalInstructions: string | null;
}): Promise<AiDigestPostSelection> {
  const { system, prompt } = buildAiDigestPostSelectionPrompt({
    profile,
    posts,
    quickTakes,
    pastRecommendations,
    personalInstructions,
    asOf: scope.asOf,
  });
  const candidatePostsById = new Map(posts.map((post) => [post.postId, post]));
  const tools = createAiDigestSelectionTools(scope, candidatePostsById);
  const result = await callSelectionModelRetryingInvalidOutput({ system, prompt, tools });
  assertAiDigestModelFinished(result, "post selection");
  const { headlinePosts, otherItems } = await resolveSelectedItems(result.output, scope, posts, quickTakes);
  return {
    subject: decodeStrayUnicodeEscapes(result.output.subject),
    preheader: decodeStrayUnicodeEscapes(result.output.preheader),
    aiNote: result.output.aiNote.map(decodeStrayUnicodeEscapes),
    headlinePosts,
    otherItems,
    call: aiDigestModelCallRecord({
      purpose: "post-selection",
      modelId: AI_DIGEST_MODEL_ID,
      promptVersion: AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
      system,
      prompt,
      result,
    }),
  };
}
