import { dataToMarkdown } from "@/server/editor/conversionUtils";
import AutomatedContentEvaluations from "../automatedContentEvaluations/collection";
import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";
import Posts from "../posts/collection";
import Comments from "../comments/collection";
import ModerationTemplates from "../moderationTemplates/collection";
import { sendRejectionPM } from "@/server/callbacks/postCallbackFunctions";
import { updateComment } from "@/server/collections/comments/mutations";
import { getAdminTeamAccount } from "@/server/utils/adminTeamAccount";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { stripExcludedContentForAIDetection } from "./preprocessing";
import {
  DEFAULT_PANGRAM_MODEL,
  PANGRAM_4_MIN_WORDS,
  PANGRAM_AUTOREJECT_THRESHOLD,
  PANGRAM_MAX_CHARS,
  type PangramModel,
} from "@/lib/collections/automatedContentEvaluations/constants";
import { sleep } from "@/lib/utils/asyncUtils";

const saplingResponseSchema = z.object({
  score: z.number(),
  sentence_scores: z.array(
    z.object({
      sentence: z.string(),
      score: z.number()
    })
  )
});

const pangramResponseSchema = z.object({
  text: z.string(),
  fraction_human: z.number(),
  fraction_ai: z.number(),
  fraction_ai_assisted: z.number(),
  prediction_short: z.enum(["AI", "AI-Assisted", "Human", "Mixed"]).optional(),
  windows: z.array(z.object({
    text: z.string(),
    ai_assistance_score: z.number(),
    start_index: z.number(),
    end_index: z.number(),
    label: z.string().optional(),
    confidence: z.string().optional(),
    word_count: z.number().optional(),
  })).optional(),
});

const pangramTaskSubmissionSchema = z.object({
  task_id: z.string().min(1),
});

const pangramTaskStageSchema = z.object({
  stage: z.string().min(1),
  error: z.string().optional(),
  headline: z.string().optional(),
  detail: z.string().optional(),
});

/** Legacy synchronous endpoint kept so automated checks continue using cheap Pangram 3. */
const PANGRAM_V3_URL = 'https://text.api.pangram.com/v3';

/** Asynchronous task endpoint, which is the only way to reach Pangram 4. */
const PANGRAM_TASK_URL = 'https://text.external-api.pangram.com/task';

const PANGRAM_TASK_POLL_INTERVAL_MS = 2000;
const PANGRAM_REQUEST_TIMEOUT_MS = 10_000;

// The graphql route's maxDuration is 120s, so give up on the task well before
// that, to leave headroom for the rest of the request and to return a useful
// error rather than having the whole invocation killed.
const PANGRAM_TASK_TIMEOUT_MS = 90_000;

export interface PangramEvaluationResult {
  analyzedText: string;
  pangramApiVersion: string | null;
  pangramScore: number;
  pangramFractionAi: number | null;
  pangramFractionAiAssisted: number | null;
  pangramFractionHuman: number | null;
  pangramMaxScore: number | null;
  pangramPrediction: "AI" | "AI-Assisted" | "Human" | "Mixed" | null;
  pangramWindowScores: {
    text: string;
    score: number;
    startIndex: number;
    endIndex: number;
    label?: string;
    confidence?: string;
    wordCount?: number;
  }[] | null;
}

async function fetchPangramResponse(url: string, key: string, deadline: number, body?: unknown): Promise<Response> {
  const remainingTime = deadline - Date.now();
  if (remainingTime <= 0) {
    throw new Error("Pangram API request timed out");
  }

  const requestTimeout = Math.min(PANGRAM_REQUEST_TIMEOUT_MS, remainingTime);
  return await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
    },
    signal: AbortSignal.timeout(requestTimeout),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function readPangramJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    const error = new Error(`Pangram API request failed with status ${response.status}: ${errorText}`);
    captureException(error);
    throw error;
  }

  try {
    return await response.json();
  } catch (e) {
    const error = new Error(`Failed to parse Pangram API response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    captureException(error);
    throw error;
  }
}

async function fetchPangramJson(url: string, key: string, deadline: number, body?: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchPangramResponse(url, key, deadline, body);
  } catch (e) {
    const parsedError = z.object({ message: z.string() }).safeParse(e);
    const error = new Error(`Pangram API request failed: ${parsedError.success ? parsedError.data.message : 'Unknown error'}`);
    captureException(error);
    throw error;
  }
  return await readPangramJson(response);
}

function parsePangramResponse(pangramResponse: unknown, apiVersion: string): PangramEvaluationResult {
  const validatedResponse = pangramResponseSchema.safeParse(pangramResponse);
  if (!validatedResponse.success) {
    const error = new Error(`Invalid Pangram API response: ${validatedResponse.error.message}`);
    // eslint-disable-next-line no-console
    console.error(`Pangram validation failed. Original response: ${JSON.stringify(pangramResponse)}`);
    captureException(error);
    throw error;
  }

  const pangramWindowScores = validatedResponse.data.windows?.map(w => ({
    text: w.text,
    score: w.ai_assistance_score,
    startIndex: w.start_index,
    endIndex: w.end_index,
    ...(w.label ? { label: w.label } : {}),
    ...(w.confidence ? { confidence: w.confidence } : {}),
    ...(w.word_count !== undefined ? { wordCount: w.word_count } : {}),
  })) ?? null;
  return {
    analyzedText: validatedResponse.data.text,
    pangramApiVersion: apiVersion,
    pangramScore: validatedResponse.data.fraction_ai + validatedResponse.data.fraction_ai_assisted,
    pangramFractionAi: validatedResponse.data.fraction_ai,
    pangramFractionAiAssisted: validatedResponse.data.fraction_ai_assisted,
    pangramFractionHuman: validatedResponse.data.fraction_human,
    pangramMaxScore: pangramWindowScores?.length
      ? Math.max(...pangramWindowScores.map(w => w.score))
      : null,
    pangramPrediction: validatedResponse.data.prediction_short ?? null,
    pangramWindowScores,
  };
}

async function waitForNextPangramPoll(deadline: number): Promise<void> {
  const remainingTime = deadline - Date.now();
  if (remainingTime > 0) {
    await sleep(Math.min(PANGRAM_TASK_POLL_INTERVAL_MS, remainingTime));
  }
}

/**
 * Poll an async Pangram inference task until it either succeeds or fails.
 * Returns the raw response body of the successful poll, which has the same
 * shape as a synchronous v3 response.
 */
async function pollPangramTask(taskId: string, key: string, deadline: number): Promise<unknown> {
  while (Date.now() < deadline) {
    let response: Response;
    try {
      response = await fetchPangramResponse(`${PANGRAM_TASK_URL}/${encodeURIComponent(taskId)}`, key, deadline);
    } catch {
      await waitForNextPangramPoll(deadline);
      continue;
    }

    const taskResponse = await readPangramJson(response);
    const validatedStage = pangramTaskStageSchema.safeParse(taskResponse);
    if (!validatedStage.success) {
      const error = new Error(`Invalid Pangram task response: ${validatedStage.error.message}`);
      captureException(error);
      throw error;
    }
    if (validatedStage.data.stage === "STAGE_SUCCESS") {
      return taskResponse;
    }
    if (validatedStage.data.stage === "STAGE_FAILED") {
      const failureMessage = validatedStage.data.error
        || validatedStage.data.headline
        || validatedStage.data.detail
        || "no error message given";
      const error = new Error(`Pangram task failed: ${failureMessage}`);
      captureException(error);
      throw error;
    }

    await waitForNextPangramPoll(deadline);
  }

  const timeoutError = new Error(`Pangram task ${taskId} did not finish within ${PANGRAM_TASK_TIMEOUT_MS / 1000} seconds`);
  captureException(timeoutError);
  throw timeoutError;
}

export async function getPangramEvaluationForText(
  text: string,
  model: PangramModel = DEFAULT_PANGRAM_MODEL,
): Promise<PangramEvaluationResult> {
  const key = process.env.PANGRAM_API_KEY;
  if (!key) {
    throw new Error("PANGRAM_API_KEY is not configured");
  }

  const textToCheck = text.slice(0, PANGRAM_MAX_CHARS);

  if (model === "pangram4") {
    const wordCount = textToCheck.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < PANGRAM_4_MIN_WORDS) {
      throw new Error(`Pangram 4 requires at least ${PANGRAM_4_MIN_WORDS} words`);
    }

    const deadline = Date.now() + PANGRAM_TASK_TIMEOUT_MS;
    const submission = await fetchPangramJson(PANGRAM_TASK_URL, key, deadline, { text: textToCheck, model: "pangram-4" });
    const validatedSubmission = pangramTaskSubmissionSchema.safeParse(submission);
    if (!validatedSubmission.success) {
      const error = new Error(`Invalid Pangram task submission response: ${validatedSubmission.error.message}`);
      captureException(error);
      throw error;
    }
    const taskResponse = await pollPangramTask(validatedSubmission.data.task_id, key, deadline);
    return parsePangramResponse(taskResponse, "pangram-4");
  }

  const pangramResponse = await fetchPangramJson(
    PANGRAM_V3_URL,
    key,
    Date.now() + PANGRAM_REQUEST_TIMEOUT_MS,
    { text: textToCheck },
  );
  return parsePangramResponse(pangramResponse, "v3");
}

export async function getPangramEvaluation(revision: DbRevision): Promise<PangramEvaluationResult> {
  const htmlWithoutExcludedContent = stripExcludedContentForAIDetection(revision.html ?? '');
  const markdown = dataToMarkdown(htmlWithoutExcludedContent, "html");
  return await getPangramEvaluationForText(markdown);
}

export async function getSaplingEvaluation(revision: DbRevision) {
  const key = process.env.SAPLING_API_KEY;
  if (!key) {
    throw new Error("SAPLING_API_KEY is not configured");
  }
  
  const markdown = dataToMarkdown(revision.html, "html");
  const textToCheck = markdown.slice(0, 10000)
  const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      text: textToCheck,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    const error = new Error(`Sapling API request failed with status ${response.status}: ${errorText}`);
    captureException(error);
    throw error;
  }
  
  let saplingEvaluation;
  try {
    saplingEvaluation = await response.json();
  } catch(e) {
    const error = new Error(`Failed to parse Sapling API response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    captureException(error);
    throw error;
  }
  
  const validatedEvaluation = saplingResponseSchema.safeParse(saplingEvaluation);
  if (!validatedEvaluation.success) {
    const error = new Error(`Invalid Sapling API response: ${validatedEvaluation.error.message}`);
    // eslint-disable-next-line no-console
    console.error(`Sapling validation failed. Original response: ${JSON.stringify(saplingEvaluation)}`);
    captureException(error);
    throw error;
  }

  return validatedEvaluation.data;
}

const NO_LLM_AUTOREJECT_TEMPLATE = "No LLM (autoreject)";

async function rejectContentForLLM(
  documentId: string,
  collectionName: "Posts" | "Comments",
  context: ResolverContext
) {
  const moderationTemplate = await ModerationTemplates.findOne({ name: NO_LLM_AUTOREJECT_TEMPLATE });
  if (!moderationTemplate) {
    // eslint-disable-next-line no-console
    console.error("Moderation template not found");
    return;
  }

  const rejectedReason = moderationTemplate.contents?.html ?? "";

  if (collectionName === "Posts") {
    const post = await context.loaders["Posts"].load(documentId);
    await Posts.rawUpdateOne(
      { _id: documentId },
      { 
        $set: { 
          rejected: true, 
          rejectedReason,
        } 
      }
    );
    // We're deliberate not sending auto-llm-rejections from a human account, 
    // because we wanna blankface in this context.
    await sendRejectionPM({ post: { ...post, rejectedReason }, currentUser: null, context });
  } else {
    // For comments, use updateComment which handles sending the rejection PM via callbacks
    // But the comment rejection DM logic is a bit different, so we need to recreate a resolver context
    // with the lwAccount that we want the DM to come from
    const lwAccount = await getAdminTeamAccount(context);
    const lwAccountContext = computeContextFromUser({ user: lwAccount, isSSR: context.isSSR });

    await updateComment({
      selector: { _id: documentId },
      data: {
        rejected: true,
        rejectedReason,
      },
    }, lwAccountContext);
  }
}

interface CreateAutomatedContentEvaluationOptions {
  /** Whether to auto-reject content that fails the Pangram AI detection check. */
  autoreject?: boolean;
}

export async function createAutomatedContentEvaluation(
  revision: DbRevision,
  context: ResolverContext,
  options: CreateAutomatedContentEvaluationOptions = {}
) {
  const { autoreject } = options;

  // we shouldn't be ending up running this on revisions where draft is true (which is for autosaves) but if we did we'd want to return early.
  if (revision.draft) return;
  const documentId = revision.documentId;
  if (!documentId) return;

  const pangramEvaluation = await getPangramEvaluation(revision).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Pangram evaluation failed: ", err);
    captureException(err);
    return null;
  });

  if (!pangramEvaluation) {
    // eslint-disable-next-line no-console
    console.error("No evaluation returned");
    return;
  }

  const aceId = await AutomatedContentEvaluations.rawInsert({
    createdAt: new Date(),
    revisionId: revision._id,
    score: null,
    sentenceScores: null,
    aiChoice: null,
    aiReasoning: null,
    aiCoT: null,
    pangramApiVersion: pangramEvaluation.pangramApiVersion,
    pangramScore: pangramEvaluation.pangramScore,
    pangramFractionAi: pangramEvaluation.pangramFractionAi,
    pangramFractionAiAssisted: pangramEvaluation.pangramFractionAiAssisted,
    pangramFractionHuman: pangramEvaluation.pangramFractionHuman,
    pangramMaxScore: pangramEvaluation.pangramMaxScore,
    pangramPrediction: pangramEvaluation.pangramPrediction,
    pangramWindowScores: pangramEvaluation.pangramWindowScores,
  });

  if (autoreject && (pangramEvaluation.pangramScore ?? 0) > PANGRAM_AUTOREJECT_THRESHOLD) {
    const collectionName = revision.collectionName;
    if (collectionName === "Posts" || collectionName === "Comments") {
      await rejectContentForLLM(documentId, collectionName, context);
    }
  }

  return aceId;
}

/**
 * Re-run the LLM detection check (using Pangram) for a post or comment and update/create the ACE record.
 * This is called from the moderation UI when a moderator wants to retry a failed check.
 * Returns the updated AutomatedContentEvaluation record.
 */
export async function rerunLlmCheck(
  documentId: string,
  collectionName: "Posts" | "Comments",
  context: ResolverContext
): Promise<DbAutomatedContentEvaluation> {
  const { Revisions } = context;

  let contentsLatest: string | null = null;

  if (collectionName === "Posts") {
    const post = await Posts.findOne({ _id: documentId });
    if (!post) {
      throw new Error("Post not found");
    }
    contentsLatest = post.contents_latest;
  } else {
    const comment = await Comments.findOne({ _id: documentId });
    if (!comment) {
      throw new Error("Comment not found");
    }
    contentsLatest = comment.contents_latest;
  }

  // Get the latest published revision
  const revision = contentsLatest
    ? await Revisions.findOne({ _id: contentsLatest })
    : null;

  if (!revision) {
    throw new Error(`No published revision found for ${collectionName === "Posts" ? "post" : "comment"}`);
  }

  // Run the Pangram evaluation - errors will propagate to the client with descriptive messages
  const pangramResult = await getPangramEvaluation(revision);

  // Check if there's an existing ACE record for this revision
  const existingAce = await AutomatedContentEvaluations.findOne({ revisionId: revision._id });

  if (existingAce) {
    // Update the existing record with the new Pangram results
    await AutomatedContentEvaluations.rawUpdateOne(
      { _id: existingAce._id },
      {
        $set: {
          pangramApiVersion: pangramResult.pangramApiVersion,
          pangramScore: pangramResult.pangramScore,
          pangramFractionAi: pangramResult.pangramFractionAi,
          pangramFractionAiAssisted: pangramResult.pangramFractionAiAssisted,
          pangramFractionHuman: pangramResult.pangramFractionHuman,
          pangramMaxScore: pangramResult.pangramMaxScore,
          pangramPrediction: pangramResult.pangramPrediction,
          pangramWindowScores: pangramResult.pangramWindowScores,
        },
      }
    );
    
    // Return the updated record
    const updatedAce = await AutomatedContentEvaluations.findOne({ _id: existingAce._id });
    if (!updatedAce) {
      throw new Error("Failed to fetch updated ACE record");
    }
    return updatedAce;
  } else {
    // Create a new ACE record with just the Pangram results
    const newAceId = await AutomatedContentEvaluations.rawInsert({
      createdAt: new Date(),
      revisionId: revision._id,
      score: null,
      sentenceScores: null,
      aiChoice: null,
      aiReasoning: null,
      aiCoT: null,
      pangramApiVersion: pangramResult.pangramApiVersion,
      pangramScore: pangramResult.pangramScore,
      pangramFractionAi: pangramResult.pangramFractionAi,
      pangramFractionAiAssisted: pangramResult.pangramFractionAiAssisted,
      pangramFractionHuman: pangramResult.pangramFractionHuman,
      pangramMaxScore: pangramResult.pangramMaxScore,
      pangramPrediction: pangramResult.pangramPrediction,
      pangramWindowScores: pangramResult.pangramWindowScores,
    });

    const newAce = await AutomatedContentEvaluations.findOne({ _id: newAceId });
    if (!newAce) {
      throw new Error("Failed to fetch created ACE record");
    }
    return newAce;
  }
}
