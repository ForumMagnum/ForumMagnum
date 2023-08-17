import Posts from "../lib/collections/posts/collection";
import { PostEmbeddingsRepo } from "./repos";
import { forEachDocumentBatchInCollection } from "./manualMigrations/migrationUtils";
import { getOpenAI } from "./languageModels/languageModelIntegration";
import { htmlToTextDefault } from "../lib/htmlToText";
import { Globals } from "./vulcan-lib";
import { inspect } from "util";
import md5 from "md5";
import { isAnyTest } from "../lib/executionEnvironment";

export const DEFAULT_EMBEDDINGS_MODEL = "text-embedding-ada-002";

type EmbeddingsResult = {
  embeddings: number[],
  model: string,
}

const getEmbeddingsFromApi = async (text: string): Promise<EmbeddingsResult> => {
  if (isAnyTest) {
    return {
      embeddings: [],
      model: "test",
    };
  }
  const api = await getOpenAI();
  if (!api) {
    throw new Error("OpenAI client is not configured");
  }
  const model = DEFAULT_EMBEDDINGS_MODEL;
  const result = await api.createEmbedding({
    input: text,
    model,
  });
  const embeddings = result?.data?.data?.[0].embedding;
  if (
    !embeddings ||
    !Array.isArray(embeddings) ||
    !embeddings.length ||
    typeof embeddings[0] !== "number"
  ) {
    throw new Error(`Invalid API response: ${inspect(result, {depth: null})}`);
  }
  return {
    embeddings,
    model,
  };
}

const getEmbeddingsForPost = async (
  postId: string,
): Promise<EmbeddingsResult & {hash: string}> => {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    throw new Error(`Can't find post with id ${postId}`);
  }
  const text = htmlToTextDefault(post.contents?.html ?? "");
  const embeddings = await getEmbeddingsFromApi(text);
  const hash = md5(text);
  return {hash, ...embeddings};
}

export const updatePostEmbeddings = async (postId: string) => {
  const {hash, embeddings, model} = await getEmbeddingsForPost(postId);
  const repo = new PostEmbeddingsRepo();
  await repo.setPostEmbeddings(postId, hash, model, embeddings);
}

const updateAllPostEmbeddings = async () => {
  await forEachDocumentBatchInCollection({
    collection: Posts,
    batchSize: 100,
    callback: async (posts: DbPost[]) => {
      try {
        await Promise.all(posts.map(({_id}) => updatePostEmbeddings(_id)));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error", e);
      }
    },
  });
}

Globals.updatePostEmbeddings = updatePostEmbeddings;
Globals.updateAllPostEmbeddings = updateAllPostEmbeddings;
