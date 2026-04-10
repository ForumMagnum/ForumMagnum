import { dataToMarkdown } from "@/server/editor/conversionUtils";
import { cheerioParse } from "@/server/utils/htmlUtil";
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
  avg_ai_likelihood: z.number(),
  max_ai_likelihood: z.number().optional(),
  prediction_short: z.enum(["AI", "Human", "Mixed"]).optional(),
  windows: z.array(z.object({
    text: z.string(),
    ai_likelihood: z.number(),
    start_index: z.number(),
    end_index: z.number(),
  })).optional(),
});

export interface PangramEvaluationResult {
  pangramScore: number;
  pangramMaxScore: number | null;
  pangramPrediction: "AI" | "Human" | "Mixed" | null;
  pangramWindowScores: { text: string; score: number; startIndex: number; endIndex: number; }[] | null;
}

/**
 * Strip elements from HTML that should not be included in AI detection scoring.
 * This includes:
 * - LLM content blocks (`div.llm-content-block`): explicitly labeled as AI-generated
 * - Collapsible sections (`.detailsBlock`): our policy permits AI content in collapsible sections
 * - Iframe widgets (`iframe[data-lexical-iframe-widget]`): contain code/HTML, not prose
 * - Code blocks (`.code-block`): contain code, not prose
 */
function stripExcludedContentForAIDetection(html: string): string {
  const $ = cheerioParse(html);
  $('div.llm-content-block').remove();
  $('.detailsBlock').remove();
  $('iframe[data-lexical-iframe-widget]').remove();
  $('.code-block').remove();
  return $.html();
}

export async function getPangramEvaluation(revision: DbRevision): Promise<PangramEvaluationResult> {
  const key = process.env.PANGRAM_API_KEY;
  if (!key) {
    throw new Error("PANGRAM_API_KEY is not configured");
  }

  const htmlWithoutExcludedContent = stripExcludedContentForAIDetection(revision.html ?? '');
  
  const markdown = dataToMarkdown(htmlWithoutExcludedContent, "html");
  // This should get the first 4-5k words.  There are longer posts but
  // it doesn't seem like it'll often be useful to check them in their
  // entirety, and every 1k words is more $$$.
  const textToCheck = markdown.slice(0, 30_000);

  const response = await fetch('https://text-extended.api.pangram.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify({ text: textToCheck }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    const error = new Error(`Pangram API request failed with status ${response.status}: ${errorText}`);
    captureException(error);
    throw error;
  }

  let pangramResponse;
  try {
    pangramResponse = await response.json();
  } catch (e) {
    const error = new Error(`Failed to parse Pangram API response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    captureException(error);
    throw error;
  }

  const validatedResponse = pangramResponseSchema.safeParse(pangramResponse);
  if (!validatedResponse.success) {
    const error = new Error(`Invalid Pangram API response: ${validatedResponse.error.message}`);
    // eslint-disable-next-line no-console
    console.error(`Pangram validation failed. Original response: ${JSON.stringify(pangramResponse)}`);
    captureException(error);
    throw error;
  }

  return {
    pangramScore: validatedResponse.data.avg_ai_likelihood,
    pangramMaxScore: validatedResponse.data.max_ai_likelihood ?? null,
    pangramPrediction: validatedResponse.data.prediction_short ?? null,
    pangramWindowScores: validatedResponse.data.windows?.map(w => ({
      text: w.text,
      score: w.ai_likelihood,
      startIndex: w.start_index,
      endIndex: w.end_index,
    })) ?? null,
  };
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
    pangramScore: pangramEvaluation.pangramScore,
    pangramMaxScore: pangramEvaluation.pangramMaxScore,
    pangramPrediction: pangramEvaluation.pangramPrediction,
    pangramWindowScores: pangramEvaluation.pangramWindowScores,
  });

  if (autoreject && (pangramEvaluation.pangramScore ?? 0) > .25) {
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
          pangramScore: pangramResult.pangramScore,
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
      pangramScore: pangramResult.pangramScore,
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
