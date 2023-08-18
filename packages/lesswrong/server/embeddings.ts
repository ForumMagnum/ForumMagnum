import Posts from "../lib/collections/posts/collection";
import { PostEmbeddingsRepo, PostsRepo } from "./repos";
import { forEachDocumentBatchInCollection } from "./manualMigrations/migrationUtils";
import { getOpenAI } from "./languageModels/languageModelIntegration";
import { htmlToTextDefault } from "../lib/htmlToText";
import { Globals } from "./vulcan-lib";
import { inspect } from "util";
import md5 from "md5";
import { isAnyTest } from "../lib/executionEnvironment";
import { isEAForum } from "../lib/instanceSettings";
import { addCronJob } from "./cronUtil";
import { TiktokenModel, encoding_for_model } from "@dqbd/tiktoken";

export const HAS_EMBEDDINGS_FOR_RECOMMENDATIONS = isEAForum;

export const DEFAULT_EMBEDDINGS_MODEL: TiktokenModel = "text-embedding-ada-002";
const DEFAULT_EMBEDDINGS_MODEL_MAX_TOKENS = 8191;

type EmbeddingsResult = {
  embeddings: number[],
  model: string,
}

/**
 * OpenAI models have a maximum number of "tokens" that the input can consist of.
 * What a token is exactly is non-trivial and must be calculated using the
 * tiktoken library, but a good general rule of thumb is that 1 token is approximately
 * 4 characters.
 *
 * This function trims a given input to make sure it contains less than `maxTokens`
 * tokens. It does this by iteratively reducing the length of the string using
 * the "1 token ~= 4 chars" heuristic, and then checking the result against the
 * actually encoding length. In the vast majority of cases, no more than 2
 * iterations of the loop should be necessary.
 */
const trimText = (
  text: string,
  model: TiktokenModel,
  maxTokens: number,
): string => {
  const encoding = encoding_for_model(model);

  for (
    let encoded = encoding.encode(text);
    encoded.length > maxTokens;
    encoded = encoding.encode(text)
  ) {
    const charsToRemove = 1 + ((encoded.length - maxTokens) * 4);
    text = text.slice(0, text.length - charsToRemove);
  }

  encoding.free();
  return text;
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
  const maxTokens = DEFAULT_EMBEDDINGS_MODEL_MAX_TOKENS;
  const trimmedText = trimText(text, model, maxTokens);
  const result = await api.createEmbedding({
    input: trimmedText,
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

export const updateMissingPostEmbeddings = async () => {
  const ids = await new PostsRepo().getPostIdsWithoutEmbeddings();
  for (const id of ids) {
    try {
      // One at a time to avoid being rate limited by the API
      await updatePostEmbeddings(id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error((e as AnyBecauseIsInput).response ?? e);
    }
  }
}

Globals.updatePostEmbeddings = updatePostEmbeddings;
Globals.updateAllPostEmbeddings = updateAllPostEmbeddings;
Globals.updateMissingPostEmbeddings = updateMissingPostEmbeddings;

if (HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
  addCronJob({
    name: "updateMissingEmbeddings",
    interval: "every 24 hours",
    job: updateMissingPostEmbeddings,
  });
}
