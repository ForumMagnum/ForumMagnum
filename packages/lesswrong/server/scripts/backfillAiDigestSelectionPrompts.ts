/* eslint-disable no-console */
import { isDevelopment } from "@/lib/executionEnvironment";
import {
  buildAiDigestPostCandidateCards,
  loadAiDigestPostCandidates,
  loadAiDigestReaderContext,
} from "@/server/aiDigest/aiDigestPostCandidates";
import { loadAiDigestHistory } from "@/server/aiDigest/aiDigestHistory";
import { buildAiDigestPostSelectionPrompt } from "@/server/aiDigest/aiDigestPostSelectionPrompt";
import {
  AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
  loadCachedAiDigestPostSummaries,
} from "@/server/aiDigest/aiDigestPostSummaries";
import AiDigestIssues from "@/server/collections/aiDigestIssues/collection";
import Users from "@/server/collections/users/collection";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

function storedPromptCharacterCount(
  issue: Pick<DbAiDigestIssue, "selectionSystemPrompt" | "selectionUserPrompt"> | undefined,
): number | null {
  const systemPrompt = issue?.selectionSystemPrompt;
  const userPrompt = issue?.selectionUserPrompt;
  return systemPrompt && userPrompt
    ? systemPrompt.length + userPrompt.length
    : null;
}

/**
 * Fill missing prompts on stored development samples with the prompt produced
 * by the current code and current reader data.
 *
 * yarn repl dev lw packages/lesswrong/server/scripts/backfillAiDigestSelectionPrompts.ts \
 *   'backfillAiDigestSelectionPrompts("ruby")'
 */
export async function backfillAiDigestSelectionPrompts(userSlug: string) {
  if (!isDevelopment) {
    throw new Error("AI digest prompt backfills may only run in development");
  }
  const user = await Users.findOne({ slug: userSlug });
  if (!user) {
    throw new Error(`No user found for slug ${userSlug}`);
  }
  const context = computeContextFromUser({
    user,
    isSSR: false,
  });
  const asOf = new Date();
  const [readerContext, history] = await Promise.all([
    loadAiDigestReaderContext(user, context, asOf),
    loadAiDigestHistory({
      userId: user._id,
      context,
    }),
  ]);
  const candidates = await loadAiDigestPostCandidates(user, context, {
    now: asOf,
    postHistoryById: history.postHistoryById,
  });
  const summaryResult = await loadCachedAiDigestPostSummaries({
    candidates,
    modelId: AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
  });
  const candidateCards = buildAiDigestPostCandidateCards(summaryResult.candidates);
  if (candidateCards.length < 5) {
    throw new Error(
      `AI digest prompt backfill needs at least five summarized candidates; found ${candidateCards.length}`,
    );
  }
  const prompt = buildAiDigestPostSelectionPrompt(
    readerContext.dossier,
    candidateCards,
    history.pastRecommendations,
    user.aiDigestPersonalInstructions?.trim() || null,
    asOf,
  );
  const issues = await AiDigestIssues.find(
    { recipientId: user._id },
    { sort: { generatedAt: -1, _id: -1 } },
    {
      _id: 1,
      spec: 1,
      generatedAt: 1,
      promptVersion: 1,
      selectionSystemPrompt: 1,
      selectionUserPrompt: 1,
    },
  ).fetch();
  const issueIds = issues
    .filter((issue) =>
      issue.spec
      && (!issue.selectionSystemPrompt || !issue.selectionUserPrompt),
    )
    .map((issue) => issue._id);

  if (issueIds.length > 0) {
    await AiDigestIssues.rawUpdateMany(
      { _id: { $in: issueIds } },
      {
        $set: {
          selectionSystemPrompt: prompt.system,
          selectionUserPrompt: prompt.prompt,
        },
      },
    );
  }

  const latestStoredPrompt = issues.find((issue) =>
    issue.selectionSystemPrompt && issue.selectionUserPrompt,
  );
  const currentPromptCharacterCount = prompt.system.length + prompt.prompt.length;
  const latestStoredPromptCharacterCount = storedPromptCharacterCount(latestStoredPrompt);
  console.log(`Backfilled ${issueIds.length} AI digest sample prompts for ${userSlug}`);
  return {
    userSlug,
    backfilledIssueCount: issueIds.length,
    promptVersion: prompt.promptVersion,
    candidateCount: candidateCards.length,
    currentPromptCharacterCount,
    currentPromptTokenEstimate: Math.ceil(currentPromptCharacterCount / 3),
    latestStoredPromptVersion: latestStoredPrompt?.promptVersion ?? null,
    latestStoredPromptCharacterCount,
  };
}
