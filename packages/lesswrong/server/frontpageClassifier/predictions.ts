import { LogisticRegression } from '../../lib/frontpageClassifier/logisticRegression';
import PostEmbeddings from '../collections/postEmbeddings/collection';
import { frontpageClassifierModel, type FrontpageClassifierModel } from '../../lib/frontpageClassifier/model';

export type ClassifierModel = FrontpageClassifierModel;

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
