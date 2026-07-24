import { mkdir, writeFile } from "fs/promises";
import path from "path";
import pgPromise from "pg-promise";
import { z } from "zod";
import { dataToMarkdown } from "@/server/editor/conversionUtils";
import { stripExcludedContentForAIDetection } from "@/server/collections/automatedContentEvaluations/preprocessing";

const PANGRAM_V3_ENDPOINT = "https://text.api.pangram.com/v3";
const DEFAULT_LIMIT_PER_BUCKET = 6;
const DEFAULT_OUTPUT_DIR = ".cursor/pangram-v3-calibration";
const DEFAULT_REVIEW_LIMIT = 24;
const DEFAULT_MIN_WORDS = 50;
const PANGRAM_MAX_ATTEMPTS = 4;

const v2WindowScoreSchema = z.object({
  text: z.string(),
  score: z.number(),
  startIndex: z.number(),
  endIndex: z.number(),
});

const v3WindowSchema = z.object({
  text: z.string(),
  ai_assistance_score: z.number(),
  start_index: z.number(),
  end_index: z.number(),
  word_count: z.number().optional(),
  label: z.string().optional(),
  confidence: z.string().optional(),
});

const pangramV3ResponseSchema = z.object({
  headline: z.string().optional(),
  prediction: z.string().optional(),
  prediction_short: z.string().optional(),
  fraction_human: z.number(),
  fraction_ai_assisted: z.number(),
  fraction_ai: z.number(),
  windows: z.array(v3WindowSchema).optional(),
}).passthrough();

interface ScriptOptions {
  outputDir: string;
  canvasPath: string | null;
  limitPerBucket: number;
  reviewLimit: number;
  minWords: number;
  seed: string;
  includeRejected: boolean;
  smokeTestOnly: boolean;
}

interface SampleRow {
  collectionName: "Posts" | "Comments";
  documentId: string;
  revisionId: string;
  scoreBucket: string;
  title: string | null;
  url: string | null;
  oldScore: number;
  oldMaxScore: number | null;
  oldPrediction: string | null;
  oldWindowScores: unknown;
  html: string | null;
  wordCount: number;
  editedAt: Date | string;
}

interface PangramWindowScore {
  text: string;
  score: number;
  startIndex: number;
  endIndex: number;
}

interface V3WindowScore extends PangramWindowScore {
  wordCount: number | null;
  label: string | null;
  confidence: string | null;
}

interface PangramV3Evaluation {
  fractionHuman: number;
  fractionAiAssisted: number;
  fractionAi: number;
  predictionShort: string | null;
  headline: string | null;
  windows: V3WindowScore[];
}

interface DerivedScores {
  v3FractionAi: number;
  v3FractionAiAssisted: number;
  v3AiOrAssisted: number;
  v3WindowWeightedAiAssistance: number | null;
  v3WindowMaxAiAssistance: number | null;
}

interface CalibrationRecord {
  collectionName: "Posts" | "Comments";
  documentId: string;
  revisionId: string;
  scoreBucket: string;
  title: string | null;
  url: string | null;
  wordCount: number;
  editedAt: string;
  textToCheck: string;
  oldScore: number;
  oldMaxScore: number | null;
  oldPrediction: string | null;
  oldWindowScores: PangramWindowScore[];
  v3: PangramV3Evaluation;
  derivedScores: DerivedScores;
  oldAutorejectDecision: boolean;
  oldHighlightDecision: boolean;
}

interface ThresholdFit {
  threshold: number;
  mismatches: number;
  falsePositives: number;
  falseNegatives: number;
}

interface CandidateAnalysis {
  candidate: keyof DerivedScores;
  nonNullCount: number;
  pearsonCorrelation: number | null;
  meanAbsoluteDelta: number | null;
  autorejectPositiveRateThreshold: number | null;
  autorejectBestDecisionThreshold: ThresholdFit | null;
  highlightPositiveRateThreshold: number | null;
  highlightBestDecisionThreshold: ThresholdFit | null;
}

interface Summary {
  generatedAt: string;
  endpoint: string;
  sampleSize: number;
  limitPerBucket: number;
  includeRejected: boolean;
  minWords: number;
  oldAutorejectCount: number;
  oldHighlightCount: number;
  analysis: CandidateAnalysis[];
  recommendedReviewCandidate: keyof DerivedScores;
  reviewRecordCount: number;
}

interface ReviewRecord {
  collectionName: "Posts" | "Comments";
  documentId: string;
  revisionId: string;
  bucket: string;
  title: string | null;
  url: string | null;
  wordCount: number;
  textToCheck: string;
  oldScore: number;
  oldMaxScore: number | null;
  oldPrediction: string | null;
  oldWindowScores: PangramWindowScore[];
  v3PredictionShort: string | null;
  v3Headline: string | null;
  v3FractionAi: number;
  v3FractionAiAssisted: number;
  v3AiOrAssisted: number;
  v3WindowWeightedAiAssistance: number | null;
  v3WindowMaxAiAssistance: number | null;
  v3WindowScores: V3WindowScore[];
  oldAutorejectDecision: boolean;
  oldHighlightDecision: boolean;
  reviewBucket: string;
  deltaVsAiOrAssisted: number;
}

function getArgValue(args: string[], name: string): string | null {
  const prefix = `${name}=`;
  const inlineArg = args.find((arg) => arg.startsWith(prefix));
  if (inlineArg) return inlineArg.slice(prefix.length);

  const index = args.indexOf(name);
  if (index < 0) return null;

  const value = args[index + 1];
  if (!value || value.startsWith("--")) return null;
  return value;
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOptions(args: string[]): ScriptOptions {
  return {
    outputDir: getArgValue(args, "--outputDir") ?? DEFAULT_OUTPUT_DIR,
    canvasPath: getArgValue(args, "--canvasPath"),
    limitPerBucket: parsePositiveInteger(getArgValue(args, "--limitPerBucket"), DEFAULT_LIMIT_PER_BUCKET),
    reviewLimit: parsePositiveInteger(getArgValue(args, "--reviewLimit"), DEFAULT_REVIEW_LIMIT),
    minWords: parsePositiveInteger(getArgValue(args, "--minWords"), DEFAULT_MIN_WORDS),
    seed: getArgValue(args, "--seed") ?? "pangram-v3-calibration",
    includeRejected: args.includes("--includeRejected"),
    smokeTestOnly: args.includes("--smokeTestOnly"),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getDatabaseUrl(): string {
  const readUrl = process.env.PG_READ_URL;
  if (readUrl) return readUrl;

  return requireEnv("PG_URL");
}

function preprocessHtmlForPangram(html: string | null): string {
  const htmlWithoutExcludedContent = stripExcludedContentForAIDetection(html ?? "");
  return dataToMarkdown(htmlWithoutExcludedContent, "html").slice(0, 30_000);
}

async function smokeTestPangramV3(apiKey: string): Promise<PangramV3Evaluation> {
  const text = [
    "This is a harmless calibration smoke test for the Pangram version three endpoint.",
    "It is ordinary prose that exists only to verify authentication, request format, and response shape.",
    "No private LessWrong content is included in this request.",
    "The script prints summary fields and stores the full results only when running the real calibration sample.",
    "This paragraph pads the text above common minimum word thresholds for AI-detection APIs.",
  ].join(" ");

  return callPangramV3WithRetry(apiKey, text);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function callPangramV3WithRetry(apiKey: string, text: string): Promise<PangramV3Evaluation> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= PANGRAM_MAX_ATTEMPTS; attempt++) {
    try {
      return await callPangramV3(apiKey, text);
    } catch (error) {
      lastError = error;
      if (attempt === PANGRAM_MAX_ATTEMPTS) break;

      const delayMs = 2_000 * attempt;
      // eslint-disable-next-line no-console
      console.warn(`Pangram v3 attempt ${attempt} failed; retrying in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function callPangramV3(apiKey: string, text: string): Promise<PangramV3Evaluation> {
  const response = await fetch(PANGRAM_V3_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unable to read error response");
    if (shouldRetryStatus(response.status)) {
      throw new Error(`Retryable Pangram v3 request failed with status ${response.status}: ${errorText}`);
    }
    throw new Error(`Pangram v3 request failed with status ${response.status}: ${errorText}`);
  }

  const validatedResponse = pangramV3ResponseSchema.parse(await response.json());
  const windows = (validatedResponse.windows ?? []).map((window): V3WindowScore => ({
    text: window.text,
    score: window.ai_assistance_score,
    startIndex: window.start_index,
    endIndex: window.end_index,
    wordCount: window.word_count ?? null,
    label: window.label ?? null,
    confidence: window.confidence ?? null,
  }));

  return {
    fractionHuman: validatedResponse.fraction_human,
    fractionAiAssisted: validatedResponse.fraction_ai_assisted,
    fractionAi: validatedResponse.fraction_ai,
    predictionShort: validatedResponse.prediction_short ?? null,
    headline: validatedResponse.headline ?? null,
    windows,
  };
}

async function loadSampleRows(dbUrl: string, options: ScriptOptions): Promise<SampleRow[]> {
  const pgp = pgPromise();
  const db = pgp(dbUrl);

  const rows = await db.manyOrNone<SampleRow>(`
    WITH scored AS (
      SELECT
        ace._id AS "aceId",
        ace."pangramScore" AS "oldScore",
        ace."pangramMaxScore" AS "oldMaxScore",
        ace."pangramPrediction" AS "oldPrediction",
        ace."pangramWindowScores" AS "oldWindowScores",
        r._id AS "revisionId",
        r."documentId",
        r."collectionName",
        r."wordCount",
        r."editedAt",
        r.html
      FROM "AutomatedContentEvaluations" ace
      JOIN "Revisions" r ON r._id = ace."revisionId"
      WHERE ace."pangramScore" IS NOT NULL
        AND r.draft IS NOT TRUE
        AND r."fieldName" = 'contents'
        AND r.html IS NOT NULL
        AND r."wordCount" >= $(minWords)
    ),
    eligible AS (
      SELECT
        s.*,
        CASE
          WHEN s."oldScore" < 0.01 THEN '00_very_low'
          WHEN s."oldScore" < 0.15 THEN '01_low'
          WHEN s."oldScore" < 0.20 THEN '02_below_highlight'
          WHEN s."oldScore" < 0.25 THEN '03_highlight_only'
          WHEN s."oldScore" <= 0.35 THEN '04_autoreject_edge'
          WHEN s."oldScore" < 0.75 THEN '05_medium'
          ELSE '06_high'
        END AS "scoreBucket",
        CASE
          WHEN s."collectionName" = 'Posts' THEN p.title
          WHEN s."collectionName" = 'Comments' THEN COALESCE(c.title, 'Comment on: ' || cp.title)
          ELSE NULL
        END AS title,
        CASE
          WHEN s."collectionName" = 'Posts' THEN 'https://www.lesswrong.com/posts/' || p._id || '/' || p.slug
          WHEN s."collectionName" = 'Comments' AND cp._id IS NOT NULL THEN 'https://www.lesswrong.com/posts/' || cp._id || '/' || cp.slug || '?commentId=' || c._id
          ELSE NULL
        END AS url
      FROM scored s
      LEFT JOIN "Posts" p ON p._id = s."documentId" AND s."collectionName" = 'Posts'
      LEFT JOIN "Comments" c ON c._id = s."documentId" AND s."collectionName" = 'Comments'
      LEFT JOIN "Posts" cp ON cp._id = c."postId"
      WHERE (
        s."collectionName" = 'Posts'
        AND p._id IS NOT NULL
        AND p.draft IS FALSE
        AND p."deletedDraft" IS FALSE
        AND p."isEvent" IS FALSE
        AND ($(includeRejected) OR p.rejected IS FALSE)
      ) OR (
        s."collectionName" = 'Comments'
        AND c._id IS NOT NULL
        AND c.draft IS FALSE
        AND c.deleted IS FALSE
        AND c.spam IS FALSE
        AND ($(includeRejected) OR c.rejected IS FALSE)
      )
    ),
    ranked AS (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY "collectionName", "scoreBucket"
          ORDER BY md5("revisionId" || $(seed))
        ) AS rn
      FROM eligible
    )
    SELECT
      "collectionName",
      "documentId",
      "revisionId",
      "scoreBucket",
      title,
      url,
      "oldScore",
      "oldMaxScore",
      "oldPrediction",
      "oldWindowScores",
      html,
      "wordCount",
      "editedAt"
    FROM ranked
    WHERE rn <= $(limitPerBucket)
    ORDER BY "collectionName", "scoreBucket", "oldScore";
  `, {
    includeRejected: options.includeRejected,
    limitPerBucket: options.limitPerBucket,
    minWords: options.minWords,
    seed: options.seed,
  });

  pgp.end();
  return rows;
}

function weightedWindowScore(windows: V3WindowScore[]): number | null {
  const weighted = windows.reduce((accumulator, window) => {
    const fallbackWeight = Math.max(1, window.endIndex - window.startIndex);
    const weight = window.wordCount ?? fallbackWeight;
    return {
      weightedScore: accumulator.weightedScore + (window.score * weight),
      totalWeight: accumulator.totalWeight + weight,
    };
  }, { weightedScore: 0, totalWeight: 0 });

  return weighted.totalWeight > 0 ? weighted.weightedScore / weighted.totalWeight : null;
}

function maxWindowScore(windows: V3WindowScore[]): number | null {
  if (windows.length === 0) return null;
  return Math.max(...windows.map((window) => window.score));
}

function deriveScores(v3: PangramV3Evaluation): DerivedScores {
  return {
    v3FractionAi: v3.fractionAi,
    v3FractionAiAssisted: v3.fractionAiAssisted,
    v3AiOrAssisted: v3.fractionAi + v3.fractionAiAssisted,
    v3WindowWeightedAiAssistance: weightedWindowScore(v3.windows),
    v3WindowMaxAiAssistance: maxWindowScore(v3.windows),
  };
}

async function buildCalibrationRecords(rows: SampleRow[], apiKey: string): Promise<CalibrationRecord[]> {
  const records: CalibrationRecord[] = [];

  for (const [index, row] of rows.entries()) {
    const textToCheck = preprocessHtmlForPangram(row.html);
    const oldWindowScores = z.array(v2WindowScoreSchema).nullable().parse(row.oldWindowScores) ?? [];
    const v3 = await callPangramV3WithRetry(apiKey, textToCheck);
    const derivedScores = deriveScores(v3);

    records.push({
      collectionName: row.collectionName,
      documentId: row.documentId,
      revisionId: row.revisionId,
      scoreBucket: row.scoreBucket,
      title: row.title,
      url: row.url,
      wordCount: row.wordCount,
      editedAt: new Date(row.editedAt).toISOString(),
      textToCheck,
      oldScore: row.oldScore,
      oldMaxScore: row.oldMaxScore,
      oldPrediction: row.oldPrediction,
      oldWindowScores,
      v3,
      derivedScores,
      oldAutorejectDecision: row.oldScore > 0.25,
      oldHighlightDecision: row.oldScore >= 0.2,
    });

    // eslint-disable-next-line no-console
    console.log(`Scored ${index + 1}/${rows.length}: ${row.collectionName} ${row.documentId} (${row.scoreBucket})`);
  }

  return records;
}

function nonNullCandidatePairs(records: CalibrationRecord[], candidate: keyof DerivedScores): Array<{ oldScore: number; candidateScore: number }> {
  return records.flatMap((record) => {
    const candidateScore = record.derivedScores[candidate];
    return candidateScore === null ? [] : [{ oldScore: record.oldScore, candidateScore }];
  });
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearsonCorrelation(pairs: Array<{ oldScore: number; candidateScore: number }>): number | null {
  if (pairs.length < 2) return null;

  const oldMean = mean(pairs.map((pair) => pair.oldScore));
  const candidateMean = mean(pairs.map((pair) => pair.candidateScore));
  if (oldMean === null || candidateMean === null) return null;

  const sums = pairs.reduce((accumulator, pair) => {
    const oldDelta = pair.oldScore - oldMean;
    const candidateDelta = pair.candidateScore - candidateMean;
    return {
      covariance: accumulator.covariance + (oldDelta * candidateDelta),
      oldVariance: accumulator.oldVariance + (oldDelta * oldDelta),
      candidateVariance: accumulator.candidateVariance + (candidateDelta * candidateDelta),
    };
  }, { covariance: 0, oldVariance: 0, candidateVariance: 0 });

  const denominator = Math.sqrt(sums.oldVariance * sums.candidateVariance);
  return denominator > 0 ? sums.covariance / denominator : null;
}

function meanAbsoluteDelta(pairs: Array<{ oldScore: number; candidateScore: number }>): number | null {
  return mean(pairs.map((pair) => Math.abs(pair.oldScore - pair.candidateScore)));
}

function thresholdForPositiveRate(scores: number[], positiveCount: number): number | null {
  if (scores.length === 0) return null;
  if (positiveCount <= 0) return Math.max(...scores);
  if (positiveCount >= scores.length) return Math.min(...scores);

  const sorted = [...scores].sort((a, b) => b - a);
  return (sorted[positiveCount - 1] + sorted[positiveCount]) / 2;
}

function fitThreshold(
  records: CalibrationRecord[],
  candidate: keyof DerivedScores,
  oldDecision: (record: CalibrationRecord) => boolean,
  newDecision: (score: number, threshold: number) => boolean
): ThresholdFit | null {
  const values = records.flatMap((record) => {
    const score = record.derivedScores[candidate];
    return score === null ? [] : [score];
  });

  if (values.length === 0) return null;

  const thresholds = [...new Set(values)].sort((a, b) => a - b);
  const fits = thresholds.map((threshold): ThresholdFit => {
    return records.reduce((fit, record) => {
      const score = record.derivedScores[candidate];
      if (score === null) return fit;

      const oldPositive = oldDecision(record);
      const newPositive = newDecision(score, threshold);
      return {
        threshold,
        mismatches: fit.mismatches + (oldPositive === newPositive ? 0 : 1),
        falsePositives: fit.falsePositives + (!oldPositive && newPositive ? 1 : 0),
        falseNegatives: fit.falseNegatives + (oldPositive && !newPositive ? 1 : 0),
      };
    }, { threshold, mismatches: 0, falsePositives: 0, falseNegatives: 0 });
  });

  return fits.sort((a, b) => a.mismatches - b.mismatches || Math.abs(a.falsePositives - a.falseNegatives) - Math.abs(b.falsePositives - b.falseNegatives))[0] ?? null;
}

function analyzeCandidate(records: CalibrationRecord[], candidate: keyof DerivedScores): CandidateAnalysis {
  const pairs = nonNullCandidatePairs(records, candidate);
  const candidateScores = pairs.map((pair) => pair.candidateScore);
  const autorejectPositiveCount = records.filter((record) => record.oldAutorejectDecision).length;
  const highlightPositiveCount = records.filter((record) => record.oldHighlightDecision).length;

  return {
    candidate,
    nonNullCount: pairs.length,
    pearsonCorrelation: pearsonCorrelation(pairs),
    meanAbsoluteDelta: meanAbsoluteDelta(pairs),
    autorejectPositiveRateThreshold: thresholdForPositiveRate(candidateScores, autorejectPositiveCount),
    autorejectBestDecisionThreshold: fitThreshold(
      records,
      candidate,
      (record) => record.oldAutorejectDecision,
      (score, threshold) => score > threshold
    ),
    highlightPositiveRateThreshold: thresholdForPositiveRate(candidateScores, highlightPositiveCount),
    highlightBestDecisionThreshold: fitThreshold(
      records,
      candidate,
      (record) => record.oldHighlightDecision,
      (score, threshold) => score >= threshold
    ),
  };
}

function buildSummary(records: CalibrationRecord[], options: ScriptOptions): Summary {
  const candidates: Array<keyof DerivedScores> = [
    "v3FractionAi",
    "v3FractionAiAssisted",
    "v3AiOrAssisted",
    "v3WindowWeightedAiAssistance",
    "v3WindowMaxAiAssistance",
  ];

  const analysis = candidates.map((candidate) => analyzeCandidate(records, candidate));

  return {
    generatedAt: new Date().toISOString(),
    endpoint: PANGRAM_V3_ENDPOINT,
    sampleSize: records.length,
    limitPerBucket: options.limitPerBucket,
    includeRejected: options.includeRejected,
    minWords: options.minWords,
    oldAutorejectCount: records.filter((record) => record.oldAutorejectDecision).length,
    oldHighlightCount: records.filter((record) => record.oldHighlightDecision).length,
    analysis,
    recommendedReviewCandidate: "v3AiOrAssisted",
    reviewRecordCount: Math.min(options.reviewLimit, records.length),
  };
}

function reviewBucket(record: CalibrationRecord): string {
  const newDecision = record.derivedScores.v3AiOrAssisted > 0.25;
  if (record.oldAutorejectDecision && !newDecision) return "old_fail_new_pass";
  if (!record.oldAutorejectDecision && newDecision) return "old_pass_new_fail";
  if (record.oldScore >= 0.15 && record.oldScore <= 0.35) return "near_threshold";
  return "large_delta";
}

function buildReviewRecords(records: CalibrationRecord[], limit: number): ReviewRecord[] {
  return records
    .map((record): ReviewRecord => ({
      collectionName: record.collectionName,
      documentId: record.documentId,
      revisionId: record.revisionId,
      bucket: record.scoreBucket,
      title: record.title,
      url: record.url,
      wordCount: record.wordCount,
      textToCheck: record.textToCheck,
      oldScore: record.oldScore,
      oldMaxScore: record.oldMaxScore,
      oldPrediction: record.oldPrediction,
      oldWindowScores: record.oldWindowScores,
      v3PredictionShort: record.v3.predictionShort,
      v3Headline: record.v3.headline,
      v3FractionAi: record.derivedScores.v3FractionAi,
      v3FractionAiAssisted: record.derivedScores.v3FractionAiAssisted,
      v3AiOrAssisted: record.derivedScores.v3AiOrAssisted,
      v3WindowWeightedAiAssistance: record.derivedScores.v3WindowWeightedAiAssistance,
      v3WindowMaxAiAssistance: record.derivedScores.v3WindowMaxAiAssistance,
      v3WindowScores: record.v3.windows,
      oldAutorejectDecision: record.oldAutorejectDecision,
      oldHighlightDecision: record.oldHighlightDecision,
      reviewBucket: reviewBucket(record),
      deltaVsAiOrAssisted: record.derivedScores.v3AiOrAssisted - record.oldScore,
    }))
    .sort((a, b) => {
      const bucketPriority = (bucket: string) => {
        if (bucket === "old_fail_new_pass") return 0;
        if (bucket === "old_pass_new_fail") return 1;
        if (bucket === "near_threshold") return 2;
        return 3;
      };

      return bucketPriority(a.reviewBucket) - bucketPriority(b.reviewBucket)
        || Math.abs(b.deltaVsAiOrAssisted) - Math.abs(a.deltaVsAiOrAssisted);
    })
    .slice(0, limit);
}

function csvEscape(value: string | number | boolean | null): string {
  if (value === null) return "";
  const stringValue = String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

function buildCsv(records: CalibrationRecord[]): string {
  const headers = [
    "collectionName",
    "documentId",
    "revisionId",
    "scoreBucket",
    "title",
    "url",
    "wordCount",
    "oldScore",
    "oldMaxScore",
    "oldPrediction",
    "v3PredictionShort",
    "v3Headline",
    "v3FractionAi",
    "v3FractionAiAssisted",
    "v3AiOrAssisted",
    "v3WindowWeightedAiAssistance",
    "v3WindowMaxAiAssistance",
    "oldAutorejectDecision",
    "oldHighlightDecision",
  ];

  const rows = records.map((record) => [
    record.collectionName,
    record.documentId,
    record.revisionId,
    record.scoreBucket,
    record.title,
    record.url,
    record.wordCount,
    record.oldScore,
    record.oldMaxScore,
    record.oldPrediction,
    record.v3.predictionShort,
    record.v3.headline,
    record.derivedScores.v3FractionAi,
    record.derivedScores.v3FractionAiAssisted,
    record.derivedScores.v3AiOrAssisted,
    record.derivedScores.v3WindowWeightedAiAssistance,
    record.derivedScores.v3WindowMaxAiAssistance,
    record.oldAutorejectDecision,
    record.oldHighlightDecision,
  ]);

  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
}

function buildCanvasSource(reviewRecords: ReviewRecord[], summary: Summary): string {
  const reviewDataJson = JSON.stringify(reviewRecords, null, 2);
  const summaryJson = JSON.stringify(summary, null, 2);

  return `import { Card, CardBody, CardHeader, Grid, H1, H2, Pill, Stack, Text, useHostTheme } from "cursor/canvas";

interface WindowScore {
  text: string;
  score: number;
  startIndex: number;
  endIndex: number;
  wordCount?: number | null;
  label?: string | null;
  confidence?: string | null;
}

interface ReviewRecord {
  collectionName: "Posts" | "Comments";
  documentId: string;
  revisionId: string;
  bucket: string;
  title: string | null;
  url: string | null;
  wordCount: number;
  textToCheck: string;
  oldScore: number;
  oldMaxScore: number | null;
  oldPrediction: string | null;
  oldWindowScores: WindowScore[];
  v3PredictionShort: string | null;
  v3Headline: string | null;
  v3FractionAi: number;
  v3FractionAiAssisted: number;
  v3AiOrAssisted: number;
  v3WindowWeightedAiAssistance: number | null;
  v3WindowMaxAiAssistance: number | null;
  v3WindowScores: WindowScore[];
  oldAutorejectDecision: boolean;
  oldHighlightDecision: boolean;
  reviewBucket: string;
  deltaVsAiOrAssisted: number;
}

interface Summary {
  generatedAt: string;
  endpoint: string;
  sampleSize: number;
  limitPerBucket: number;
  includeRejected: boolean;
  minWords: number;
  oldAutorejectCount: number;
  oldHighlightCount: number;
  analysis: unknown[];
  recommendedReviewCandidate: string;
  reviewRecordCount: number;
}

interface Segment {
  text: string;
  score: number | null;
}

const reviewRecords: ReviewRecord[] = ${reviewDataJson};
const summary: Summary = ${summaryJson};

function formatScore(score: number | null | undefined) {
  return score === null || score === undefined ? "n/a" : score.toFixed(3);
}

function scoreBackground(score: number, isDark: boolean) {
  const adjustedRatio = Math.pow(Math.max(0, Math.min(1, score)), 0.7);
  const hue = 120 - (adjustedRatio * 120);
  return isDark ? \`hsl(\${hue}, 55%, 25%)\` : \`hsl(\${hue}, 100%, 85%)\`;
}

function splitTextByWindows(text: string, windows: WindowScore[]): Segment[] {
  const sortedWindows = [...windows]
    .filter((window) => window.score > 0 && window.endIndex > window.startIndex)
    .sort((a, b) => a.startIndex - b.startIndex);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const window of sortedWindows) {
    const start = Math.max(cursor, Math.min(text.length, window.startIndex));
    const end = Math.max(start, Math.min(text.length, window.endIndex));
    if (start > cursor) segments.push({ text: text.slice(cursor, start), score: null });
    if (end > start) segments.push({ text: text.slice(start, end), score: window.score });
    cursor = end;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), score: null });
  return segments;
}

function HighlightedText({ text, windows }: { text: string; windows: WindowScore[] }) {
  const theme = useHostTheme();
  const isDark = theme.kind === "dark";
  const segments = splitTextByWindows(text, windows);

  return (
    <div style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.55, color: theme.text.primary }}>
      {segments.map((segment, index) => (
        <span
          key={index}
          style={{
            background: segment.score === null ? "transparent" : scoreBackground(segment.score, isDark),
            borderRadius: segment.score === null ? 0 : 3,
          }}
          title={segment.score === null ? undefined : \`Score: \${segment.score.toFixed(3)}\`}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
}

function DecisionPill({ positive, label }: { positive: boolean; label: string }) {
  return <Pill tone={positive ? "warning" : "neutral"}>{label}: {positive ? "flagged" : "pass"}</Pill>;
}

function ExampleCard({ record }: { record: ReviewRecord }) {
  const theme = useHostTheme();
  const title = record.title ?? \`\${record.collectionName} \${record.documentId}\`;
  const v3AutorejectDecision = record.v3AiOrAssisted > 0.25;

  return (
    <Card>
      <CardHeader trailing={<Pill tone={record.oldAutorejectDecision === v3AutorejectDecision ? "neutral" : "warning"}>delta {formatScore(record.deltaVsAiOrAssisted)}</Pill>}>
        {title}
      </CardHeader>
      <CardBody>
        <Stack gap={12}>
          <Text tone="secondary">{record.reviewBucket} · {record.collectionName} · {record.wordCount} words</Text>
          <Grid columns={4} gap={8}>
            <Text>Old avg: {formatScore(record.oldScore)}</Text>
            <Text>Old max: {formatScore(record.oldMaxScore)}</Text>
            <Text>V3 AI: {formatScore(record.v3FractionAi)}</Text>
            <Text>V3 AI+assist: {formatScore(record.v3AiOrAssisted)}</Text>
          </Grid>
          <Grid columns={4} gap={8}>
            <DecisionPill positive={record.oldAutorejectDecision} label="old .25" />
            <DecisionPill positive={v3AutorejectDecision} label="v3 .25" />
            <Pill tone="neutral">old {record.oldPrediction ?? "n/a"}</Pill>
            <Pill tone="neutral">v3 {record.v3PredictionShort ?? record.v3Headline ?? "n/a"}</Pill>
          </Grid>
          {record.url && <Text style={{ color: theme.text.secondary }}>{record.url}</Text>}
          <Grid columns={2} gap={12}>
            <div>
              <H2>V2 Stored Window Scores</H2>
              <HighlightedText text={record.textToCheck} windows={record.oldWindowScores} />
            </div>
            <div>
              <H2>V3 AI Assistance Scores</H2>
              <HighlightedText text={record.textToCheck} windows={record.v3WindowScores} />
            </div>
          </Grid>
        </Stack>
      </CardBody>
    </Card>
  );
}

export default function PangramV3CalibrationCanvas() {
  const grouped = [
    { id: "old_fail_new_pass", title: "Old Flagged, V3 Passes" },
    { id: "old_pass_new_fail", title: "Old Passed, V3 Flags" },
    { id: "near_threshold", title: "Near Old Threshold" },
    { id: "large_delta", title: "Largest Remaining Deltas" },
  ].map((group) => ({
    ...group,
    records: reviewRecords.filter((record) => record.reviewBucket === group.id),
  })).filter((group) => group.records.length > 0);

  return (
    <Stack gap={16}>
      <div>
        <H1>Pangram V3 Calibration Review</H1>
        <Text>Generated {summary.generatedAt}. Sample size {summary.sampleSize}; old .25 positives {summary.oldAutorejectCount}; old .2 positives {summary.oldHighlightCount}.</Text>
      </div>
      {grouped.map((group) => (
        <div key={group.id}>
          <Stack gap={12}>
            <H2>{group.title}</H2>
            {group.records.map((record) => (
              <div key={record.revisionId}>
                <ExampleCard record={record} />
              </div>
            ))}
          </Stack>
        </div>
      ))}
    </Stack>
  );
}
`;
}

async function writeArtifacts(records: CalibrationRecord[], options: ScriptOptions): Promise<void> {
  const outputDir = path.resolve(process.cwd(), options.outputDir);
  await mkdir(outputDir, { recursive: true });

  const summary = buildSummary(records, options);
  const reviewRecords = buildReviewRecords(records, options.reviewLimit);

  await writeFile(path.join(outputDir, "pangram-v3-comparison.json"), JSON.stringify(records, null, 2), "utf8");
  await writeFile(path.join(outputDir, "pangram-v3-comparison.csv"), buildCsv(records), "utf8");
  await writeFile(path.join(outputDir, "pangram-v3-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  await writeFile(path.join(outputDir, "pangram-v3-review-data.json"), JSON.stringify(reviewRecords, null, 2), "utf8");

  if (options.canvasPath && reviewRecords.length > 0) {
    const canvasPath = path.resolve(process.cwd(), options.canvasPath);
    await mkdir(path.dirname(canvasPath), { recursive: true });
    await writeFile(canvasPath, buildCanvasSource(reviewRecords, summary), "utf8");
  }

  // eslint-disable-next-line no-console
  console.log(`Wrote ${records.length} calibration records to ${outputDir}`);
  if (options.canvasPath) {
    // eslint-disable-next-line no-console
    console.log(`Wrote side-by-side canvas to ${path.resolve(process.cwd(), options.canvasPath)}`);
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const apiKey = requireEnv("PANGRAM_API_KEY");
  const smokeTest = await smokeTestPangramV3(apiKey);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    endpoint: PANGRAM_V3_ENDPOINT,
    fractionAi: smokeTest.fractionAi,
    fractionAiAssisted: smokeTest.fractionAiAssisted,
    fractionHuman: smokeTest.fractionHuman,
    predictionShort: smokeTest.predictionShort,
    headline: smokeTest.headline,
    windowCount: smokeTest.windows.length,
  }, null, 2));

  if (options.smokeTestOnly) return;

  const rows = await loadSampleRows(getDatabaseUrl(), options);
  // eslint-disable-next-line no-console
  console.log(`Loaded ${rows.length} sampled revisions`);

  const records = await buildCalibrationRecords(rows, apiKey);
  await writeArtifacts(records, options);
}

void main();
