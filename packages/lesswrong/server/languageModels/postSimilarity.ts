import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { Posts } from '../../lib/collections/posts/collection';
import { PostEmbeddings } from '../../lib/collections/postEmbeddings/collection';
import { addCronJob } from '../cronUtil';
import { getCollectionHooks } from '../mutationCallbacks';
import { getOpenAI, wikiSlugToTemplate, LanguageModelTemplate } from './languageModelIntegration';
import { postToPrompt } from './autoTagCallbacks';
import { createMutator } from '../vulcan-lib/mutators';
import { makeMigrationProgressStats } from '../manualMigrations/migrationUtils';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import { Globals } from '../../lib/vulcan-lib/config';
import { getLatestRev } from '../editor/make_editable_callbacks';
import { cosineSimilarity } from '../utils/vectorUtil';
import find from 'lodash/find';
import chunk from 'lodash/chunk';

augmentFieldsDict(Posts, {
  similarPosts: {
    resolveAs: {
      type: '[Post!]',
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<DbPost[]> => {
        // TODO
        return [];
      }
    },
  },
});

addCronJob({
  name: "updateSimilarityScores",
  interval: "every 1 day",
  job: async () => {
    // TODO
  }
});

getCollectionHooks("Posts").editAsync.add(async (newPost,oldPost) => {
  await createOrUpdatePostEmbedding(newPost);
})

getCollectionHooks("Posts").newAfter.add(async (post) => {
  await createOrUpdatePostEmbedding(post);
})

async function createOrUpdatePostEmbedding(post: DbPost) {
  const template = await wikiSlugToTemplate("lm-config-post-embedding");
  const {embeddingType, embeddingVector} = await getPostEmbedding(template, post);
  
  const existingEmbedding = await PostEmbeddings.findOne({postId: post._id});
  
  if (existingEmbedding) {
    await PostEmbeddings.rawUpdateOne(
      {_id: existingEmbedding._id},
      {$set: {
        embeddingType,
        embeddingVector,
      }}
    );
  } else {
    await createMutator({
      collection: PostEmbeddings,
      document: {
        postId: post._id,
        revisionId: post.contents_latest,
        embeddingType,
        embeddingVector,
      },
      validate: false,
    });
  }
}

export async function getPostEmbedding(template: LanguageModelTemplate, post: DbPost): Promise<{
  embeddingType: string,
  embeddingVector: number[]
}> {
  const api = await getOpenAI();
  if (!api) throw new Error("OpenAI API unavailable");
  
  const input = await postToPrompt({
    template, post,
    promptSuffix: "",
  });
  
  const embeddingType = "text-embedding-ada-002"; //TODO: Get this from the template
  
  const embeddingApiResult = await api.createEmbedding({
    model: embeddingType,
    input,
  });
  if (!embeddingApiResult) {
    throw new Error("Failed to retrieve embedding");
  }
  
  return {
    embeddingType,
    embeddingVector: embeddingApiResult.data.data[0].embedding
  };
}

async function createPostEmbeddings() {
  console.log("Creating post embeddings"); // eslint-disable-line no-console
  
  const allPostIds: string[] = (await Posts.find(
    {...getDefaultViewSelector("Posts")},
    {projection: {_id:1}}
  ).fetch()).map(post => post._id);
  
  console.log("Filtering posts which don't already have embeddings"); // eslint-disable-line no-console
  const postIdsWithEmbeddings: Set<string> = new Set(
    (await PostEmbeddings.find(
      {},
      {projection: {postId:1}}
    ).fetch()).map(embedding => embedding.postId)
  );
  
  const postsWithoutEmbeddings = allPostIds.filter(postId => !postIdsWithEmbeddings.has(postId));
  
  console.log(`Retrieving embeddings for ${postsWithoutEmbeddings.length} posts`); //eslint-disable-line no-console
  const startedAt = new Date();
  let numFinished = 0;
  
  for (let postIdBatch of chunk(postsWithoutEmbeddings, 5)) {
    const progress = makeMigrationProgressStats({
      numFinished, startedAt,
      numTotal: postsWithoutEmbeddings.length
    });
    console.log(`Creating embeddings for batch of ${postIdBatch.length} posts... (${progress.asStr})`); //eslint-disable-line no-console
    
    const posts = await Posts.find({_id: {$in: postIdBatch}}).fetch();
    await Promise.all(posts.map(post => createOrUpdatePostEmbedding(post)));
    numFinished += postIdBatch.length;
  }
  
  // eslint-disable-next-line no-console
  console.log("Finished creating post embeddings");
}
Globals.createPostEmbeddings = createPostEmbeddings;

Globals.fillRevisionIds = async () => {
  const embeddingsWithoutRevisionIds = await PostEmbeddings.find({
    revisionId: {$exists: false}
  }).fetch();
  for (let embedding of embeddingsWithoutRevisionIds) {
    const post = await Posts.findOne({_id: embedding.postId});
    if (!post) throw new Error(`Missing post ID for embedding: ${embedding._id}`);
    const revisionId = post.contents_latest || (await getLatestRev(post._id, "contents"))?._id;
    if (!revisionId) {
      // eslint-disable-next-line no-console
      console.log(`Missing revision ID for embedding: ${embedding._id}`);
      continue;
    }
    await PostEmbeddings.rawUpdateOne({_id: embedding._id}, {$set: {revisionId}});
  }
}


function getPostPairSimilarity({postA, postB, embeddingA, embeddingB}: {
  postA: DbPost,
  embeddingA: DbPostEmbedding,
  postB: DbPost,
  embeddingB: DbPostEmbedding,
}): number {
  const cosSimilarity = cosineSimilarity(embeddingA.embeddingVector, embeddingB.embeddingVector);
  
  // Shared author bonus.
  // TODO: Look at both main-author field and coauthors.
  const hasSharedAuthor = (postA.userId===postB.userId);
  
  // Temporal proximity bonus. Linear falloff from 1 (simultaneous) to 0 (365
  // days apart).
  const timeApartMS = postA.postedAt.getTime() - postB.postedAt.getTime();
  const oneYearMS = 1000*60*60*24*365;
  const temporalProximity = Math.max(0, 1.0 - (timeApartMS/oneYearMS));
  
  // Does either post have a link/pingback to the other?
  const hasPingback = find(postA.pingbacks, postB._id) || find(postB.pingbacks, postA._id);
  
  return (
      (cosSimilarity  * 10)
    + (hasSharedAuthor   ? 3:0)
    + (temporalProximity ? 2:0)
    + (hasPingback       ? 2:0)
  );
}

function getPostSimilarityBasedRecommendability({postA, postB, embeddingA, embeddingB}: {
  postA: DbPost,
  embeddingA: DbPostEmbedding,
  postB: DbPost,
  embeddingB: DbPostEmbedding,
}): number {
  const similarity = getPostPairSimilarity({postA,embeddingA,postB,embeddingB});
  const rescaledKarma = postB.baseScore/50.0; //TODO
  return similarity + rescaledKarma;
}
