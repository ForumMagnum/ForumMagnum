import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { Posts } from '../../lib/collections/posts/collection';
import { PostEmbeddings } from '../../lib/collections/postEmbeddings/collection';
import { addCronJob } from '../cronUtil';
import { getCollectionHooks } from '../mutationCallbacks';
import { getOpenAI, wikiSlugToTemplate, LanguageModelTemplate } from './languageModelIntegration';
import { postToPrompt } from './autoTagCallbacks';
import { createMutator } from '../vulcan-lib/mutators';
import { forEachDocumentBatchInCollection } from '../manualMigrations/migrationUtils';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import { Globals } from '../../lib/vulcan-lib/config';

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
  // eslint-disable-next-line no-console
  console.log("Creating post embeddings");
  
  await forEachDocumentBatchInCollection({
    collection: Posts,
    filter: getDefaultViewSelector("Posts"),
    callback: async (posts: DbPost[]) => {
      // eslint-disable-next-line no-console
      console.log(`Creating embeddings for batch of ${posts.length} posts...`);
      for (let post of posts) {
        await createOrUpdatePostEmbedding(post);
      }
    }
  });
  
  // eslint-disable-next-line no-console
  console.log("Finished creating post embeddings");
}
Globals.createPostEmbeddings = createPostEmbeddings;
