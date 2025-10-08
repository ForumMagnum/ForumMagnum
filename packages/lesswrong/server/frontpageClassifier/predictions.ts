/**
 * Frontpage classifier predictions
 * Pure functions for classifying posts using embeddings-based ML model
 */

import { LogisticRegression } from '../../lib/frontpageClassifier/logisticRegression';
import PostEmbeddings from '../collections/postEmbeddings/collection';
import { frontpageClassifierModel, type FrontpageClassifierModel } from '../../lib/frontpageClassifier/model';

export type ClassifierModel = FrontpageClassifierModel;

export interface PredictionResult {
  isFrontpage: boolean;
  probability: number; // Probability that the post should be on frontpage (0-1)
}

// Lazy-loaded model instance (initialized on first use, cached in module scope)
let modelInstance: LogisticRegression | null = null;
let threshold: number = 0.5;

/**
 * Get or initialize the model
 * In serverless environments, this will be cached across invocations within the same container
 */
function getModel(): LogisticRegression {
  if (!modelInstance) {
    // Skip loading if it's just the placeholder model
    if (frontpageClassifierModel.metadata.trainingSetSize === 0) {
      throw new Error('Placeholder model detected. Please train the real model first.');
    }

    modelInstance = new LogisticRegression();
    modelInstance.fromJSON(frontpageClassifierModel.model);
    threshold = frontpageClassifierModel.metadata.threshold;

    // eslint-disable-next-line no-console
    console.log(`Frontpage classifier loaded. Accuracy: ${(frontpageClassifierModel.metadata.accuracy * 100).toFixed(2)}%`);
  }
  return modelInstance;
}

/**
 * Parse embeddings from various storage formats
 */
function parseEmbeddings(embeddingData: any): number[] {
  if (typeof embeddingData === 'string') {
    if (embeddingData.startsWith('[')) {
      return JSON.parse(embeddingData);
    } else {
      return embeddingData.split(',').map(Number);
    }
  } else if (Array.isArray(embeddingData)) {
    return embeddingData;
  } else {
    return Array.from(embeddingData);
  }
}

/**
 * Classify a single post by its ID
 */
export async function classifyPost(postId: string): Promise<PredictionResult | null> {
  try {
    const model = getModel();

    // Fetch embeddings from database
    const embedding = await PostEmbeddings.findOne({ postId });

    if (!embedding || !embedding.embeddings) {
      // No embeddings available for this post
      return null;
    }

    const embeddingsArray = parseEmbeddings(embedding.embeddings);

    // Get prediction from model
    const probability = model.predict(embeddingsArray);
    const isFrontpage = probability >= threshold;

    return {
      isFrontpage,
      probability
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error classifying post ${postId}:`, error);
    return null;
  }
}

/**
 * Classify multiple posts in batch
 */
export async function classifyPosts(
  postIds: string[],
): Promise<Record<string, PredictionResult>> {
  try {
    const model = getModel();
    const results: Record<string, PredictionResult> = {};

    // Fetch all embeddings in one query
    const embeddings = await PostEmbeddings.find(
      { postId: { $in: postIds } },
      { projection: { postId: 1, embeddings: 1 } }
    ).fetch();

    // eslint-disable-next-line no-console
    console.log(`Classifier: Requested ${postIds.length} posts, found ${embeddings.length} with embeddings`);

    if (embeddings.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`No embeddings found for posts: ${postIds.join(', ')}`);
    }

    // Create a map for quick lookup
    const embeddingsByPostId = new Map<string, any>();
    embeddings.forEach(e => embeddingsByPostId.set(e.postId, e.embeddings));

    // Process each post
    for (const postId of postIds) {
      const embeddingData = embeddingsByPostId.get(postId);

      if (!embeddingData) {
        // No embeddings for this post, skip
        continue;
      }

      try {
        const embeddingsArray = parseEmbeddings(embeddingData);

        // Get prediction
        const probability = model.predict(embeddingsArray);
        const isFrontpage = probability >= threshold;

        results[postId] = {
          isFrontpage,
          probability
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error processing embeddings for post ${postId}:`, error);
      }
    }

    return results;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in batch classification:', error);
    return {};
  }
}

/**
 * Get model metadata
 */
export function getModelMetadata(): ClassifierModel['metadata'] {
  return frontpageClassifierModel.metadata;
}

/**
 * Check if the model is ready to use
 */
export function isModelReady(): boolean {
  return frontpageClassifierModel.metadata.trainingSetSize > 0;
}
