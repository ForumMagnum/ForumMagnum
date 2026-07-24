import { generateText, Output, stepCountIs } from "ai";
import type { ModelMessage, TextPart } from "ai";
import { z } from "zod";
import {
  type AiDigestSelectedPostCandidate,
  buildAiDigestPostCandidateCards,
  isSelectableAiDigestCandidate,
  loadAiDigestPostCandidates,
  loadAiDigestReaderContext,
  type LoadAiDigestPostCandidatesOptions,
} from "./aiDigestPostCandidates";
import {
  AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID,
  loadCachedAiDigestPostSummaries,
} from "./aiDigestPostSummaries";
import {
  loadAiDigestHistory,
  persistAiDigestIssue,
  type AiDigestIssueTrigger,
  type AiDigestIssueInsert,
  type AiDigestSelectionTokenUsage,
} from "./aiDigestHistory";
import {
  AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
  buildAiDigestPostSelectionPrompt,
} from "./aiDigestPostSelectionPrompt";
import {
  AI_DIGEST_SELECTION_STEP_LIMIT,
  createAiDigestDiscoveredCandidateRegistry,
  createAiDigestSelectionTools,
} from "./aiDigestSelectionTools";
import {
  type AiDigestItem,
  type AiDigestSpec,
  rubyAiDigestSpec,
} from "@/server/emailComponents/AiDigestSpec";

export const AI_DIGEST_DEFAULT_SELECTION_MODEL_ID = "anthropic/claude-fable-5";

export const AI_DIGEST_SELECTION_LENGTH_LIMITS = {
  subject: 120,
  preheader: 180,
  aiNoteParagraph: 380,
  reason: 180,
};

function selectionPromptTextPart(text: string, cacheAfter: boolean): TextPart {
  return cacheAfter
    ? {
      type: "text",
      text,
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    }
    : { type: "text", text };
}

export function buildAiDigestSelectionMessages({
  sharedPrefix,
  personalizedSuffix,
  enableAnthropicCaching,
}: {
  sharedPrefix: string;
  personalizedSuffix: string;
  enableAnthropicCaching: boolean;
}): ModelMessage[] {
  return [{
    role: "user",
    content: [
      selectionPromptTextPart(sharedPrefix, enableAnthropicCaching),
      selectionPromptTextPart(`\n\n${personalizedSuffix}`, false),
    ],
  }];
}

const selectionOutputSchema = z.object({
  selectedPosts: z.array(z.object({
    postId: z.string(),
    reason: z.string().nullable(),
  })).length(5),
  subject: z.string(),
  preheader: z.string(),
  aiNote: z.array(z.string()).min(1).max(3),
});

export type AiDigestPostSelectionModelOutput = z.infer<typeof selectionOutputSchema>;

export interface AiDigestPostSelectionOptions {
  selectionModelId?: string;
  selectionModelLabel?: string;
  summaryModelId?: string;
  candidateOptions?: LoadAiDigestPostCandidatesOptions;
  historyIssueLimit?: number;
  trigger?: AiDigestIssueTrigger;
  /**
   * When false, run selection/validation/assembly without writing an AiDigestIssues
   * row. Defaults to true for production digests.
   */
  persistIssue?: boolean;
}

export interface AiDigestPostSelectionResult {
  spec: AiDigestSpec;
  selectedCandidates: AiDigestSelectedPostCandidate[];
  issueId: string | null;
  generatedAt: Date;
  metadata: {
    selectionModelId: string;
    selectionModelLabel: string;
    selectionPromptVersion: string;
    summaryModelId: string;
    candidateCount: number;
    evidenceCount: number;
    reusedSummaryCount: number;
    skippedPostCount: number;
    historyIssueCount: number;
    pastRecommendationCount: number;
    toolCallCount: number;
    searchCount: number;
    readPostCount: number;
    discoveredCandidateCount: number;
    inputTokenCount: number | null;
    uncachedInputTokenCount: number | null;
    cacheReadInputTokenCount: number | null;
    cacheWriteInputTokenCount: number | null;
  };
}

export interface AiDigestPostSelectionFinalizationDependencies {
  persistIssue?: (issue: AiDigestIssueInsert) => Promise<string>;
}

export interface AiDigestPostSelectionFinalizationResult {
  output: AiDigestPostSelectionModelOutput;
  spec: AiDigestSpec;
  selectedCandidates: AiDigestSelectedPostCandidate[];
  issueId: string | null;
}

function assertLength(name: string, text: string, maximum: number): void {
  if (!text.trim() || text.length > maximum) {
    throw new Error(`${name} must contain 1-${maximum} characters`);
  }
}

export function validateAiDigestPostSelectionOutput(
  output: AiDigestPostSelectionModelOutput,
  candidates: AiDigestSelectedPostCandidate[],
): AiDigestPostSelectionModelOutput {
  if (output.selectedPosts.length !== 5) {
    throw new Error("Selection must contain exactly five posts");
  }
  const candidatePostIds = new Set(candidates.map((candidate) => candidate.postId));
  const selectedPostIds = output.selectedPosts.map((selection) => selection.postId);
  if (new Set(selectedPostIds).size !== 5) {
    throw new Error("Selection must contain five distinct posts");
  }
  const unknownPostId = selectedPostIds.find((postId) => !candidatePostIds.has(postId));
  if (unknownPostId) {
    throw new Error(`Selection referenced unknown post ID: ${unknownPostId}`);
  }
  const candidatesByPostId = new Map(
    candidates.map((candidate) => [candidate.postId, candidate]),
  );
  const ineligiblePostId = selectedPostIds.find((postId) => {
    const candidate = candidatesByPostId.get(postId);
    return candidate && !isSelectableAiDigestCandidate(candidate);
  });
  if (ineligiblePostId) {
    throw new Error(`Selection referenced an ineligible post ID: ${ineligiblePostId}`);
  }
  if (output.aiNote.length < 1 || output.aiNote.length > 3) {
    throw new Error("AI note must contain one to three paragraphs");
  }

  output.selectedPosts.forEach((selection) => {
    if (selection.reason !== null) {
      assertLength(
        `Reason for ${selection.postId}`,
        selection.reason,
        AI_DIGEST_SELECTION_LENGTH_LIMITS.reason,
      );
    }
  });

  assertLength("Subject", output.subject, AI_DIGEST_SELECTION_LENGTH_LIMITS.subject);
  assertLength("Preheader", output.preheader, AI_DIGEST_SELECTION_LENGTH_LIMITS.preheader);
  output.aiNote.forEach((paragraph, index) => {
    assertLength(
      `AI note paragraph ${index + 1}`,
      paragraph,
      AI_DIGEST_SELECTION_LENGTH_LIMITS.aiNoteParagraph,
    );
  });
  return output;
}

function selectedPostItem(
  selection: AiDigestPostSelectionModelOutput["selectedPosts"][number],
  candidate: AiDigestSelectedPostCandidate,
  index: number,
): AiDigestItem {
  return {
    documentRef: {
      documentType: "post",
      documentId: candidate.postId,
    },
    placement: index < 2 ? "headline" : "compact",
    ...(selection.reason !== null ? { reason: selection.reason } : {}),
  };
}

export function buildAiDigestSpecFromPostSelection({
  recipientName,
  modelLabel,
  output,
  candidates,
}: {
  recipientName: string;
  modelLabel: string;
  output: AiDigestPostSelectionModelOutput;
  candidates: AiDigestSelectedPostCandidate[];
}): AiDigestSpec {
  const candidatesByPostId = new Map(
    candidates.map((candidate) => [candidate.postId, candidate]),
  );
  const selectedPostItems = output.selectedPosts.map((selection, index) => {
    const candidate = candidatesByPostId.get(selection.postId);
    if (!candidate) {
      throw new Error(`Cannot assemble unknown post ${selection.postId}`);
    }
    return selectedPostItem(selection, candidate, index);
  });
  const sections = rubyAiDigestSpec.sections.map((section) => {
    if (section.kind !== "recommendations") {
      return {
        ...section,
        items: section.items.map((item) => ({ ...item })),
      };
    }
    const fixedNonPostItems = section.items
      .filter((item) => item.documentRef.documentType !== "post")
      .map((item) => ({ ...item }));
    return {
      ...section,
      items: [...selectedPostItems, ...fixedNonPostItems],
    };
  });

  return {
    recipientName,
    subject: output.subject,
    preheader: output.preheader,
    aiNote: {
      modelName: modelLabel,
      paragraphs: output.aiNote,
    },
    sections,
  };
}

export async function finalizeAiDigestPostSelection({
  recipientId,
  recipientName,
  modelLabel,
  selectionModelId,
  promptVersion,
  selectionSystemPrompt,
  selectionUserPrompt,
  tokenUsage,
  generatedAt,
  trigger,
  personalInstructions,
  output,
  candidates,
  dependencies,
}: {
  recipientId: string;
  recipientName: string;
  modelLabel: string;
  selectionModelId: string;
  promptVersion: string;
  selectionSystemPrompt: string;
  selectionUserPrompt: string;
  tokenUsage: AiDigestSelectionTokenUsage;
  generatedAt: Date;
  trigger: AiDigestIssueTrigger;
  personalInstructions: string | null;
  output: AiDigestPostSelectionModelOutput;
  candidates: AiDigestSelectedPostCandidate[];
  dependencies: AiDigestPostSelectionFinalizationDependencies;
}): Promise<AiDigestPostSelectionFinalizationResult> {
  const validatedOutput = validateAiDigestPostSelectionOutput(
    output,
    candidates,
  );
  const spec = buildAiDigestSpecFromPostSelection({
    recipientName,
    modelLabel,
    output: validatedOutput,
    candidates,
  });
  const selectedCandidatesByPostId = new Map(
    candidates.map((candidate) => [candidate.postId, candidate]),
  );
  const selectedCandidates = validatedOutput.selectedPosts.flatMap((selection) => {
    const candidate = selectedCandidatesByPostId.get(selection.postId);
    return candidate ? [candidate] : [];
  });
  const issueId = dependencies.persistIssue
    ? await dependencies.persistIssue({
      recipientId,
      postIds: selectedCandidates.map((candidate) => candidate.postId),
      generatedAt,
      trigger,
      personalInstructions,
      selectionModelId,
      promptVersion,
      selectionSystemPrompt,
      selectionUserPrompt,
      ...tokenUsage,
      spec,
    })
    : null;
  return {
    output: validatedOutput,
    spec,
    selectedCandidates,
    issueId,
  };
}

export function humanizeAiDigestModelId(modelId: string): string {
  const modelName = modelId.split("/").at(-1) ?? modelId;
  return modelName
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}

export async function generateAiDigestPostSelection({
  user,
  context,
  options = {},
}: {
  user: DbUser;
  context: ResolverContext;
  options?: AiDigestPostSelectionOptions;
}): Promise<AiDigestPostSelectionResult> {
  const selectionModelId = options.selectionModelId ?? AI_DIGEST_DEFAULT_SELECTION_MODEL_ID;
  const selectionModelLabel = options.selectionModelLabel
    ?? humanizeAiDigestModelId(selectionModelId);
  const summaryModelId = options.summaryModelId ?? AI_DIGEST_DEFAULT_SUMMARY_MODEL_ID;
  const personalInstructions = user.aiDigestPersonalInstructions?.trim() || null;
  const asOf = options.candidateOptions?.now ?? new Date();
  const [readerContext, history] = await Promise.all([
    loadAiDigestReaderContext(user, context, asOf),
    loadAiDigestHistory({
      userId: user._id,
      context,
      issueLimit: options.historyIssueLimit,
    }),
  ]);
  const candidates = await loadAiDigestPostCandidates(user, context, {
    ...options.candidateOptions,
    now: asOf,
    postHistoryById: history.postHistoryById,
  });
  const summaryResult = await loadCachedAiDigestPostSummaries({
    candidates,
    modelId: summaryModelId,
  });
  const candidateCards = buildAiDigestPostCandidateCards(summaryResult.candidates);
  const selectableCandidateCards = candidateCards.filter(isSelectableAiDigestCandidate);
  if (selectableCandidateCards.length < 5) {
    throw new Error(
      "AI digest needs at least five summarized, selectable candidates; "
      + `found ${selectableCandidateCards.length} of ${candidateCards.length}`,
    );
  }
  const prompt = buildAiDigestPostSelectionPrompt(
    readerContext.dossier,
    candidateCards,
    history.pastRecommendations,
    personalInstructions,
    asOf,
  );
  const discoveredRegistry = createAiDigestDiscoveredCandidateRegistry();
  const { tools, getUsageCounts } = createAiDigestSelectionTools({
    toolsContext: {
      user,
      context,
      corpusPostIds: new Set(candidateCards.map((candidate) => candidate.postId)),
      postHistoryById: history.postHistoryById,
      now: asOf,
      minKarma: options.candidateOptions?.minKarma,
    },
    registry: discoveredRegistry,
  });
  const result = await generateText({
    model: selectionModelId,
    system: prompt.system,
    messages: buildAiDigestSelectionMessages({
      sharedPrefix: prompt.sharedPrefix,
      personalizedSuffix: prompt.personalizedSuffix,
      enableAnthropicCaching: selectionModelId.startsWith("anthropic/"),
    }),
    tools,
    stopWhen: stepCountIs(AI_DIGEST_SELECTION_STEP_LIMIT),
    output: Output.object({
      schema: selectionOutputSchema,
      name: "aiDigestPostSelection",
      description: "A ranked five-post LessWrong digest selection.",
    }),
    maxOutputTokens: 12_000,
  });
  if (result.finishReason !== "stop") {
    throw new Error(
      `AI digest selection stopped with finish reason ${result.finishReason} after `
      + `${result.totalUsage.outputTokens ?? 0} output tokens`,
    );
  }
  const toolUsage = getUsageCounts();
  const tokenUsage: AiDigestSelectionTokenUsage = {
    inputTokenCount: result.totalUsage.inputTokens ?? null,
    uncachedInputTokenCount: result.totalUsage.inputTokenDetails.noCacheTokens ?? null,
    cacheReadInputTokenCount: result.totalUsage.inputTokenDetails.cacheReadTokens ?? null,
    cacheWriteInputTokenCount: result.totalUsage.inputTokenDetails.cacheWriteTokens ?? null,
  };
  const generatedAt = new Date();
  const shouldPersistIssue = options.persistIssue !== false;
  const validationCandidates: AiDigestSelectedPostCandidate[] = [
    ...selectableCandidateCards,
    ...Array.from(discoveredRegistry.byPostId.values()),
  ];
  const finalized = await finalizeAiDigestPostSelection({
    recipientId: user._id,
    recipientName: user.displayName,
    modelLabel: selectionModelLabel,
    selectionModelId,
    promptVersion: AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
    selectionSystemPrompt: prompt.system,
    selectionUserPrompt: prompt.prompt,
    tokenUsage,
    generatedAt,
    trigger: options.trigger ?? "adminSample",
    personalInstructions,
    output: result.output,
    candidates: validationCandidates,
    dependencies: shouldPersistIssue
      ? { persistIssue: persistAiDigestIssue }
      : {},
  });

  return {
    spec: finalized.spec,
    selectedCandidates: finalized.selectedCandidates,
    issueId: finalized.issueId,
    generatedAt,
    metadata: {
      selectionModelId,
      selectionModelLabel,
      selectionPromptVersion: AI_DIGEST_POST_SELECTION_PROMPT_VERSION,
      summaryModelId,
      candidateCount: candidateCards.length,
      evidenceCount: readerContext.evidenceCount,
      reusedSummaryCount: summaryResult.reusedSummaryCount,
      skippedPostCount: summaryResult.skippedPostCount,
      historyIssueCount: history.issues.length,
      pastRecommendationCount: history.pastRecommendations.length,
      ...toolUsage,
      ...tokenUsage,
    },
  };
}
