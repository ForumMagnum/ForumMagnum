import { LogisticRegression } from '../../lib/frontpageClassifier/logisticRegression';
import PostEmbeddings from '../collections/postEmbeddings/collection';
import { frontpageClassifierModel, type FrontpageClassifierModel } from '../../lib/frontpageClassifier/model';
import { getSqlClientOrThrow } from '../sql/sqlClient';
import { postStatuses } from '../../lib/collections/posts/constants';
import { isLW, requireReviewToFrontpagePostsSetting } from '../../lib/instanceSettings';

export type ClassifierModel = FrontpageClassifierModel;

/**
 * List of user IDs whose posts should not be automatically classified.
 * These users' posts will skip the auto-frontpage classifier and remain
 * subject to manual review only.
 */
const EXCLUDED_USER_IDS: string[] = [
  "N9zj5qpTfqmbn9dro", // Many newsletters/timeful posts which are covering frontpage-y topics :(
];

export interface PredictionResult {
  isFrontpage: boolean;
  probability: number;
}


export async function classifyPost(postId: string): Promise<PredictionResult | null> {
  if (frontpageClassifierModel.metadata.trainingSetSize === 0) {
    throw new Error('Placeholder model detected. Please train the real model first.');
  }

  const model = new LogisticRegression();
  model.fromJSON(frontpageClassifierModel.model);
  const threshold = frontpageClassifierModel.metadata.threshold;

  const embedding = await PostEmbeddings.findOne({ postId });

  if (!embedding || !embedding.embeddings) {
    return null;
  }

  const probability = model.predict(embedding.embeddings);
  const isFrontpage = probability >= threshold;

  return {
    isFrontpage,
    probability
  };
}

export async function classifyPosts(
  postIds: string[],
): Promise<Record<string, PredictionResult>> {
  if (frontpageClassifierModel.metadata.trainingSetSize === 0) {
    throw new Error('Placeholder model detected. Please train the real model first.');
  }

  const model = new LogisticRegression();
  model.fromJSON(frontpageClassifierModel.model);
  const threshold = frontpageClassifierModel.metadata.threshold;

  const results: Record<string, PredictionResult> = {};

  const embeddings = await PostEmbeddings.find(
    { postId: { $in: postIds } },
    { projection: { postId: 1, embeddings: 1 } }
  ).fetch();

  const embeddingsByPostId = new Map<string, number[]>();
  embeddings.forEach(e => embeddingsByPostId.set(e.postId, e.embeddings));

  for (const postId of postIds) {
    const embeddingData = embeddingsByPostId.get(postId);

    if (!embeddingData) {
      continue;
    }

    const probability = model.predict(embeddingData);
    const isFrontpage = probability >= threshold;

    results[postId] = {
      isFrontpage,
      probability
    };
  }

  return results;
}

export interface ClassifierAccuracyResult {
  // Counts
  truePositives: number;   // Predicted frontpage, actually frontpage
  falsePositives: number;  // Predicted frontpage, actually personal
  trueNegatives: number;   // Predicted personal, actually personal
  falseNegatives: number;  // Predicted personal, actually frontpage

  // Rates
  truePositiveRate: number;   // TP / (TP + FN) - aka recall/sensitivity
  falsePositiveRate: number;  // FP / (FP + TN)
  trueNegativeRate: number;   // TN / (TN + FP) - aka specificity
  falseNegativeRate: number;  // FN / (FN + TP)

  // Additional metrics
  accuracy: number;           // (TP + TN) / total
  precision: number;          // TP / (TP + FP) - of predicted frontpage, how many were correct
  recall: number;             // TP / (TP + FN) - of actual frontpage, how many did we catch
  f1Score: number;

  // Totals
  totalPosts: number;
  totalActualFrontpage: number;
  totalActualPersonal: number;
  totalPredictedFrontpage: number;
  totalPredictedPersonal: number;

  // Metadata
  dateRange: {
    start: Date;
    end: Date;
  };
  threshold: number;
}

interface PostWithPrediction {
  postId: string;
  title: string;
  isFrontpage: boolean;          // actual (based on frontpageDate)
  predictedFrontpage: boolean;
  probability: number;
}

/**
 * Automatically apply the frontpage classifier's decision to a newly published post.
 * This function should only be called after embeddings are generated for a post.
 */
export async function maybeAutoFrontpagePost(postId: string, context: ResolverContext): Promise<void> {
  const { Posts } = context;
  if (!isLW()) {
    return;
  }

  if (frontpageClassifierModel.metadata.trainingSetSize === 0) {
    return;
  }

  if (requireReviewToFrontpagePostsSetting.get()) {
    return;
  }

  const post = await Posts.findOne({
    _id: postId,
    frontpageDate: null,
    draft: false,
    isEvent: false,
    submitToFrontpage: true,
    shortform: false,
    question: false,
    // We need to review posts that were published by unreviewed users manually,
    // since we don't yet have any callbacks which go back and update posts/comments
    // to have authorIsUnreviewed: false when we review a user.  It's probably not
    // difficult but a bit gnarly/circular, so punting to later.
    authorIsUnreviewed: false,
    userId: { $nin: EXCLUDED_USER_IDS },
  });

  if (!post) {
    return;
  }

  const prediction = await classifyPost(postId);
  if (!prediction) {
    return;
  }

  const { getAdminTeamAccountId } = await import('../utils/adminTeamAccount');
  const adminTeamAccountId = await getAdminTeamAccountId(context);
  if (!adminTeamAccountId) {
    return;
  }

  const updateModifier = {
    $set: {
      reviewedByUserId: adminTeamAccountId,
      ...(prediction.isFrontpage ? { frontpageDate: new Date() } : {}),
    }
  };

  await Posts.rawUpdateOne({ _id: postId }, updateModifier);
}


/**
 * The below code was basically entirely generated by Opus 4.5, and not carefully reviewed.
 * Analyze the accuracy of the frontpage classifier against actual moderator decisions.
 *
 * This compares model predictions to the actual frontpage status (determined by
 * whether frontpageDate is set) for posts published after the model was trained.
 *
 * Usage:
 *   yarn repl prod packages/lesswrong/server/frontpageClassifier/predictions.ts "analyzeClassifierAccuracy()"
 *
 * @param startDate - Start of the analysis period (default: model training date)
 * @param endDate - End of the analysis period (default: now)
 * @param options.verbose - If true, logs detailed information including misclassifications
 */
export async function analyzeClassifierAccuracy(
  startDate?: Date,
  endDate?: Date,
  options: { verbose?: boolean } = {}
): Promise<ClassifierAccuracyResult> {
  const { verbose = true } = options;

  if (frontpageClassifierModel.metadata.trainingSetSize === 0) {
    throw new Error('Placeholder model detected. Please train the real model first.');
  }

  const db = getSqlClientOrThrow();

  // Default to analyzing posts from when the model was trained to now
  const modelTrainedAt = new Date(frontpageClassifierModel.metadata.trainedAt);
  const start = startDate || modelTrainedAt;
  const end = endDate || new Date();
  const threshold = frontpageClassifierModel.metadata.threshold;

  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(`Analyzing classifier accuracy from ${start.toISOString()} to ${end.toISOString()}`);
    // eslint-disable-next-line no-console
    console.log(`Using threshold: ${threshold}`);
  }

  // Query posts with the same criteria as training, but from the analysis period
  // We want posts that:
  // - Are not drafts
  // - Are approved
  // - Are not future posts
  // - Are not unlisted
  // - Are not shortform
  // - Are not from unreviewed authors
  // - Are not questions
  // - Are not events
  // - Were submitted to frontpage (author opted in)
  // - Have embeddings
  const query = `
    SELECT
      p._id as post_id,
      p.title,
      p."frontpageDate",
      pe.embeddings
    FROM "Posts" p
    INNER JOIN "PostEmbeddings" pe ON p._id = pe."postId"
    WHERE
      p.draft = false
      AND p.status = $1
      AND p."isFuture" IS false
      AND p.unlisted IS false
      AND p.shortform IS false
      AND p."authorIsUnreviewed" IS false
      AND p.rejected IS false
      AND p.question IS false
      AND p."isEvent" IS false
      AND p."postedAt" >= $2
      AND p."postedAt" <= $3
      AND p."submitToFrontpage" IS true
      AND pe.embeddings IS NOT NULL
    ORDER BY p."postedAt" DESC
  `;

  const results = await db.any(query, [
    postStatuses.STATUS_APPROVED,
    start.toISOString(),
    end.toISOString()
  ]);

  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(`Found ${results.length} posts to analyze`);
  }

  if (results.length === 0) {
    throw new Error('No posts found in the specified date range with embeddings');
  }

  // Initialize the model
  const model = new LogisticRegression();
  model.fromJSON(frontpageClassifierModel.model);

  // Run predictions and compare to actual status
  const postsWithPredictions: PostWithPrediction[] = [];

  for (const row of results) {
    // Parse embeddings
    let embeddings: number[];
    if (typeof row.embeddings === 'string') {
      if (row.embeddings.startsWith('[')) {
        embeddings = JSON.parse(row.embeddings);
      } else {
        embeddings = row.embeddings.split(',').map(Number);
      }
    } else if (Array.isArray(row.embeddings)) {
      embeddings = row.embeddings;
    } else {
      embeddings = Array.from(row.embeddings);
    }

    const probability = model.predict(embeddings);
    const predictedFrontpage = probability >= threshold;
    const actualFrontpage = !!row.frontpageDate;

    postsWithPredictions.push({
      postId: row.post_id,
      title: row.title,
      isFrontpage: actualFrontpage,
      predictedFrontpage,
      probability
    });
  }

  // Calculate confusion matrix
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  const falsePositiveExamples: PostWithPrediction[] = [];
  const falseNegativeExamples: PostWithPrediction[] = [];

  for (const post of postsWithPredictions) {
    if (post.predictedFrontpage && post.isFrontpage) {
      truePositives++;
    } else if (post.predictedFrontpage && !post.isFrontpage) {
      falsePositives++;
      falsePositiveExamples.push(post);
    } else if (!post.predictedFrontpage && !post.isFrontpage) {
      trueNegatives++;
    } else {
      // !predictedFrontpage && isFrontpage
      falseNegatives++;
      falseNegativeExamples.push(post);
    }
  }

  // Calculate rates
  const totalActualFrontpage = truePositives + falseNegatives;
  const totalActualPersonal = trueNegatives + falsePositives;
  const totalPredictedFrontpage = truePositives + falsePositives;
  const totalPredictedPersonal = trueNegatives + falseNegatives;
  const totalPosts = postsWithPredictions.length;

  const truePositiveRate = totalActualFrontpage > 0 ? truePositives / totalActualFrontpage : 0;
  const falsePositiveRate = totalActualPersonal > 0 ? falsePositives / totalActualPersonal : 0;
  const trueNegativeRate = totalActualPersonal > 0 ? trueNegatives / totalActualPersonal : 0;
  const falseNegativeRate = totalActualFrontpage > 0 ? falseNegatives / totalActualFrontpage : 0;

  const accuracy = (truePositives + trueNegatives) / totalPosts;
  const precision = totalPredictedFrontpage > 0 ? truePositives / totalPredictedFrontpage : 0;
  const recall = truePositiveRate; // Same as TPR
  const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  if (verbose) {
    // eslint-disable-next-line no-console
    console.log('\n========== CLASSIFIER ACCURACY ANALYSIS ==========');
    // eslint-disable-next-line no-console
    console.log(`\nDate range: ${start.toISOString()} to ${end.toISOString()}`);
    // eslint-disable-next-line no-console
    console.log(`Threshold: ${threshold}`);

    // eslint-disable-next-line no-console
    console.log('\n--- Confusion Matrix ---');
    // eslint-disable-next-line no-console
    console.log(`                    Actual Frontpage    Actual Personal`);
    // eslint-disable-next-line no-console
    console.log(`Pred Frontpage      ${truePositives.toString().padStart(6)}              ${falsePositives.toString().padStart(6)}`);
    // eslint-disable-next-line no-console
    console.log(`Pred Personal       ${falseNegatives.toString().padStart(6)}              ${trueNegatives.toString().padStart(6)}`);

    // eslint-disable-next-line no-console
    console.log('\n--- Counts ---');
    // eslint-disable-next-line no-console
    console.log(`True Positives:  ${truePositives} (predicted frontpage, was frontpage)`);
    // eslint-disable-next-line no-console
    console.log(`False Positives: ${falsePositives} (predicted frontpage, was personal)`);
    // eslint-disable-next-line no-console
    console.log(`True Negatives:  ${trueNegatives} (predicted personal, was personal)`);
    // eslint-disable-next-line no-console
    console.log(`False Negatives: ${falseNegatives} (predicted personal, was frontpage)`);

    // eslint-disable-next-line no-console
    console.log('\n--- Rates ---');
    // eslint-disable-next-line no-console
    console.log(`True Positive Rate (Recall/Sensitivity):  ${(truePositiveRate * 100).toFixed(2)}%`);
    // eslint-disable-next-line no-console
    console.log(`False Positive Rate:                      ${(falsePositiveRate * 100).toFixed(2)}%`);
    // eslint-disable-next-line no-console
    console.log(`True Negative Rate (Specificity):         ${(trueNegativeRate * 100).toFixed(2)}%`);
    // eslint-disable-next-line no-console
    console.log(`False Negative Rate:                      ${(falseNegativeRate * 100).toFixed(2)}%`);

    // eslint-disable-next-line no-console
    console.log('\n--- Overall Metrics ---');
    // eslint-disable-next-line no-console
    console.log(`Accuracy:  ${(accuracy * 100).toFixed(2)}%`);
    // eslint-disable-next-line no-console
    console.log(`Precision: ${(precision * 100).toFixed(2)}%`);
    // eslint-disable-next-line no-console
    console.log(`Recall:    ${(recall * 100).toFixed(2)}%`);
    // eslint-disable-next-line no-console
    console.log(`F1 Score:  ${(f1Score * 100).toFixed(2)}%`);

    // eslint-disable-next-line no-console
    console.log('\n--- Distribution ---');
    // eslint-disable-next-line no-console
    console.log(`Total posts analyzed:     ${totalPosts}`);
    // eslint-disable-next-line no-console
    console.log(`Actual frontpage posts:   ${totalActualFrontpage} (${(totalActualFrontpage / totalPosts * 100).toFixed(1)}%)`);
    // eslint-disable-next-line no-console
    console.log(`Actual personal posts:    ${totalActualPersonal} (${(totalActualPersonal / totalPosts * 100).toFixed(1)}%)`);
    // eslint-disable-next-line no-console
    console.log(`Predicted frontpage:      ${totalPredictedFrontpage} (${(totalPredictedFrontpage / totalPosts * 100).toFixed(1)}%)`);
    // eslint-disable-next-line no-console
    console.log(`Predicted personal:       ${totalPredictedPersonal} (${(totalPredictedPersonal / totalPosts * 100).toFixed(1)}%)`);

    // Show some examples of misclassifications
    if (falsePositiveExamples.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n--- Sample False Positives (predicted frontpage, was personal) ---');
      const sortedFP = falsePositiveExamples.sort((a, b) => b.probability - a.probability);
      for (const post of sortedFP.slice(0, 20)) {
        // eslint-disable-next-line no-console
        console.log(`  "${post.title} - ${post.postId}" (prob: ${(post.probability * 100).toFixed(1)}%)`);
      }
    }

    if (falseNegativeExamples.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n--- Sample False Negatives (predicted personal, was frontpage) ---');
      const sortedFN = falseNegativeExamples.sort((a, b) => a.probability - b.probability);
      for (const post of sortedFN.slice(0, 10)) {
        // eslint-disable-next-line no-console
        console.log(`  "${post.title} - ${post.postId}" (prob: ${(post.probability * 100).toFixed(1)}%)`);
      }
    }

    // eslint-disable-next-line no-console
    console.log('\n====================================================');
  }

  return {
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    truePositiveRate,
    falsePositiveRate,
    trueNegativeRate,
    falseNegativeRate,
    accuracy,
    precision,
    recall,
    f1Score,
    totalPosts,
    totalActualFrontpage,
    totalActualPersonal,
    totalPredictedFrontpage,
    totalPredictedPersonal,
    dateRange: { start, end },
    threshold
  };
}
