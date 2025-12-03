/**
 * Script to train a frontpage classifier using post embeddings
 *
 * Usage:
 * yarn repl prod packages/lesswrong/server/scripts/frontpageClassifier/trainClassifier.ts "trainFrontpageClassifier()"
 */

/* eslint-disable no-console */

import { LogisticRegression } from '../../../lib/frontpageClassifier/logisticRegression';
import { postStatuses } from '../../../lib/collections/posts/constants';
import fs from 'fs';
import path from 'path';
import { getSqlClientOrThrow } from '../../sql/sqlClient';

interface TrainingDataPoint {
  embeddings: number[];
  isFrontpage: boolean;
  postId: string;
  title: string;
}

interface ModelMetadata {
  trainedAt: Date;
  trainingSetSize: number;
  testSetSize: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveWeight: number;
  falseNegativeWeight: number;
  threshold: number;
}

/**
 * Extract training data from posts with embeddings
 */
async function extractTrainingData(startDate?: Date, endDate?: Date): Promise<TrainingDataPoint[]> {
  const db = getSqlClientOrThrow();

  // Default date range if not specified
  const start = startDate || new Date('2023-01-01');
  const end = endDate || new Date('2025-01-01');

  console.log(`Extracting training data from ${start.toISOString()} to ${end.toISOString()}`);

  // Query for posts with embeddings and known frontpage status
  const query = `
    SELECT
      p._id as post_id,
      p.title,
      p."frontpageDate",
      p."baseScore",
      p."submitToFrontpage",
      pe.embeddings
    FROM "Posts" p
    INNER JOIN "PostEmbeddings" pe ON p._id = pe."postId"
    WHERE
      p.draft = false
      AND p.status = $1
      AND p."isFuture" = false
      AND p.unlisted = false
      AND p.shortform = false
      AND p."authorIsUnreviewed" = false
      AND p.question = false
      AND p."isEvent" = false
      AND p."baseScore" >= 2
      AND p."postedAt" >= $2
      AND p."postedAt" <= $3
      AND p."submitToFrontpage" = true
      AND pe.embeddings IS NOT NULL
    ORDER BY p."postedAt" DESC
  `;

  const results = await db.any(query, [
    postStatuses.STATUS_APPROVED,
    start.toISOString(),
    end.toISOString()
  ]);

  console.log(`Found ${results.length} posts with embeddings`);

  // Convert to training data format
  const trainingData: TrainingDataPoint[] = results.map(row => {
    // Parse embeddings from pgvector format
    let embeddings: number[];
    if (typeof row.embeddings === 'string') {
      // Format: [0.1,0.2,0.3,...] or just raw numbers
      if (row.embeddings.startsWith('[')) {
        embeddings = JSON.parse(row.embeddings);
      } else {
        embeddings = row.embeddings.split(',').map(Number);
      }
    } else if (Array.isArray(row.embeddings)) {
      embeddings = row.embeddings;
    } else {
      // Handle pgvector binary format if needed
      embeddings = Array.from(row.embeddings);
    }

    return {
      embeddings,
      isFrontpage: !!row.frontpageDate,
      postId: row.post_id,
      title: row.title
    };
  });

  // Log distribution
  const frontpageCount = trainingData.filter(d => d.isFrontpage).length;
  const personalCount = trainingData.length - frontpageCount;
  console.log(`Data distribution: ${frontpageCount} frontpage, ${personalCount} personal`);

  return trainingData;
}

/**
 * Split data into training and test sets
 */
function splitData(data: TrainingDataPoint[], testRatio = 0.2): {
  train: TrainingDataPoint[];
  test: TrainingDataPoint[];
} {
  // Shuffle data
  const shuffled = [...data].sort(() => Math.random() - 0.5);

  // Stratified split to maintain class balance
  const frontpage = shuffled.filter(d => d.isFrontpage);
  const personal = shuffled.filter(d => !d.isFrontpage);

  const frontpageTestSize = Math.floor(frontpage.length * testRatio);
  const personalTestSize = Math.floor(personal.length * testRatio);

  const test = [
    ...frontpage.slice(0, frontpageTestSize),
    ...personal.slice(0, personalTestSize)
  ];

  const train = [
    ...frontpage.slice(frontpageTestSize),
    ...personal.slice(personalTestSize)
  ];

  // Shuffle again
  return {
    train: train.sort(() => Math.random() - 0.5),
    test: test.sort(() => Math.random() - 0.5)
  };
}

/**
 * Train the frontpage classifier
 */
export async function trainFrontpageClassifier(
  startDate?: Date,
  endDate?: Date,
  options: {
    falsePositiveWeight?: number;
    falseNegativeWeight?: number;
    learningRate?: number;
    epochs?: number;
    testRatio?: number;
    useWeightsForTraining?: boolean;
  } = {}
): Promise<void> {
  const {
    falsePositiveWeight = 4,
    falseNegativeWeight = 1,
    learningRate = 0.01,
    epochs = 1000,
    testRatio = 0.2,
    useWeightsForTraining = false
  } = options;

  console.log('Starting frontpage classifier training...');
  console.log(`Options: FP weight=${falsePositiveWeight}, FN weight=${falseNegativeWeight}`);

  // Extract training data
  const allData = await extractTrainingData(startDate, endDate);

  if (allData.length < 100) {
    throw new Error(`Insufficient training data: ${allData.length} samples. Need at least 100.`);
  }

  // Split into train/test
  const { train, test } = splitData(allData, testRatio);
  console.log(`Split data: ${train.length} training, ${test.length} test samples`);

  // Prepare data for training
  const X_train = train.map(d => d.embeddings);
  const y_train = train.map(d => d.isFrontpage ? 1 : 0);

  const X_test = test.map(d => d.embeddings);
  const y_test = test.map(d => d.isFrontpage ? 1 : 0);

  // Train the model
  const model = new LogisticRegression();
  console.log('Training logistic regression model...');

  const trainingResult = model.train(X_train, y_train, {
    learningRate,
    epochs,
    falsePositiveWeight,
    falseNegativeWeight,
    verbose: true
  });

  console.log('\nTraining Results:');
  console.log(`Loss: ${trainingResult.loss.toFixed(4)}`);
  console.log(`Accuracy: ${(trainingResult.accuracy * 100).toFixed(2)}%`);
  console.log(`Precision: ${(trainingResult.precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(trainingResult.recall * 100).toFixed(2)}%`);
  console.log(`F1 Score: ${(trainingResult.f1Score * 100).toFixed(2)}%`);

  // Evaluate on test set
  console.log('\nEvaluating on test set...');
  const testResult = model.evaluate(X_test, y_test, {
    falsePositiveWeight: useWeightsForTraining ? falsePositiveWeight : 1,
    falseNegativeWeight: useWeightsForTraining ? falseNegativeWeight : 1
  });

  console.log('Test Results:');
  console.log(`Loss: ${testResult.loss.toFixed(4)}`);
  console.log(`Accuracy: ${(testResult.accuracy * 100).toFixed(2)}%`);
  console.log(`Precision: ${(testResult.precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(testResult.recall * 100).toFixed(2)}%`);
  console.log(`F1 Score: ${(testResult.f1Score * 100).toFixed(2)}%`);

  // Find optimal threshold considering weighted costs
  const thresholds = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];
  let bestThreshold = 0.5;
  let bestCost = Infinity;

  console.log('\nFinding optimal threshold...');
  for (const threshold of thresholds) {
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < X_test.length; i++) {
      const pred = model.predict(X_test[i]) >= threshold ? 1 : 0;
      const actual = y_test[i];

      if (pred === 1 && actual === 0) falsePositives++;
      if (pred === 0 && actual === 1) falseNegatives++;
    }

    const cost = (falsePositives * falsePositiveWeight) + (falseNegatives * falseNegativeWeight);
    console.log(`Threshold ${threshold}: FP=${falsePositives}, FN=${falseNegatives}, Cost=${cost}`);

    if (cost < bestCost) {
      bestCost = cost;
      bestThreshold = threshold;
    }
  }

  console.log(`\nOptimal threshold: ${bestThreshold}`);

  // Re-evaluate with optimal threshold
  const optimalResult = model.evaluate(X_test, y_test, {
    falsePositiveWeight,
    falseNegativeWeight,
    threshold: bestThreshold
  });

  console.log('\nResults with optimal threshold:');
  console.log(`Accuracy: ${(optimalResult.accuracy * 100).toFixed(2)}%`);
  console.log(`Precision: ${(optimalResult.precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(optimalResult.recall * 100).toFixed(2)}%`);

  // Save model
  const modelData = {
    model: model.toJSON(),
    metadata: {
      trainedAt: new Date(),
      trainingSetSize: train.length,
      testSetSize: test.length,
      accuracy: optimalResult.accuracy,
      precision: optimalResult.precision,
      recall: optimalResult.recall,
      f1Score: optimalResult.f1Score,
      falsePositiveWeight,
      falseNegativeWeight,
      threshold: bestThreshold
    } as ModelMetadata
  };

  // Generate TypeScript file content
  const tsContent = `/**
 * Frontpage classifier model - auto-generated by trainClassifier.ts
 *
 * Training date: ${new Date().toISOString()}
 * Training set size: ${train.length}
 * Test set size: ${test.length}
 * Accuracy: ${(optimalResult.accuracy * 100).toFixed(2)}%
 * Precision: ${(optimalResult.precision * 100).toFixed(2)}%
 * Recall: ${(optimalResult.recall * 100).toFixed(2)}%
 * F1 Score: ${(optimalResult.f1Score * 100).toFixed(2)}%
 * Threshold: ${bestThreshold}
 */

export interface ModelMetadata {
  trainedAt: string;
  trainingSetSize: number;
  testSetSize: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveWeight: number;
  falseNegativeWeight: number;
  threshold: number;
}

export interface FrontpageClassifierModel {
  model: {
    weights: number[];
    bias: number;
  };
  metadata: ModelMetadata;
}

export const frontpageClassifierModel: FrontpageClassifierModel = ${JSON.stringify(modelData, null, 2)};
`;

  // Save to TypeScript file
  const modelPath = path.join(process.cwd(), 'packages/lesswrong/lib/frontpageClassifier/model.ts');
  fs.writeFileSync(modelPath, tsContent);
  console.log(`\nModel saved to ${modelPath}`);

  // Also save some misclassified examples for debugging
  console.log('\nAnalyzing misclassifications...');
  const misclassified: Array<{
    title: string;
    actual: string;
    predicted: string;
    confidence: number;
  }> = [];

  for (let i = 0; i < test.length && misclassified.length < 10; i++) {
    const prob = model.predict(test[i].embeddings);
    const pred = prob >= bestThreshold;
    const actual = test[i].isFrontpage;

    if (pred !== actual) {
      misclassified.push({
        title: test[i].title,
        actual: actual ? 'Frontpage' : 'Personal',
        predicted: pred ? 'Frontpage' : 'Personal',
        confidence: pred ? prob : 1 - prob
      });
    }
  }

  console.log('\nSample misclassifications:');
  misclassified.forEach(m => {
    console.log(`- "${m.title}"`);
    console.log(`  Actual: ${m.actual}, Predicted: ${m.predicted} (${(m.confidence * 100).toFixed(1)}%)`);
  });
}

// Export for REPL usage
export default { trainFrontpageClassifier };
