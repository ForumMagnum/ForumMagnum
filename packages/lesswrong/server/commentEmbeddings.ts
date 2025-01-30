import { getOpenAI } from "./languageModels/languageModelIntegration";
import { htmlToTextDefault } from "../lib/htmlToText";
import { createAdminContext, Globals } from "./vulcan-lib";
import md5 from "md5";
import { isAnyTest } from "../lib/executionEnvironment";
import { trimText } from "./embeddings";
import mapValues from "lodash/mapValues";
import { EMBEDDINGS_VECTOR_SIZE } from "@/lib/collections/commentEmbeddings/schema";
import { VoyageAIClient } from "voyageai";
import { EmbedResponseDataItem } from "voyageai/api/types";
import { fetchFragment, fetchFragmentSingle } from "./fetchFragment";
import { userGetDisplayName } from "@/lib/collections/users/helpers";

type EmbeddingsResult = {
  embeddings: number[],
  model: string,
}

type EmbeddingsWithHash = EmbeddingsResult & { hash: string };

const TOKENIZER_MODEL = "text-embedding-ada-002" as const;
const DEFAULT_EMBEDDINGS_MODEL = "text-embedding-3-large" as const;
const DEFAULT_EMBEDDINGS_MODEL_MAX_TOKENS = 8191;

const VOYAGE_MODEL = "voyage-3-large" as const;

type EmbeddingProvider = "openai" | "voyage";
const EMBEDDING_PROVIDER: EmbeddingProvider = "voyage"; // Can be configured via env var later

const commentEmbeddingsSettings = {
  tokenizerModel: TOKENIZER_MODEL,
  embeddingModel: DEFAULT_EMBEDDINGS_MODEL,
  maxTokens: DEFAULT_EMBEDDINGS_MODEL_MAX_TOKENS,
  dimensions: EMBEDDINGS_VECTOR_SIZE,
  supportsBatchUpdate: true,
};

const getVoyageClient = () => {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) return null;
  return new VoyageAIClient({ apiKey });
};

const getEmbeddingsFromVoyage = async <T extends string | Record<string, string>>(inputs: T, inputType: 'document' | 'query'): Promise<{
  embeddings: T extends string ? number[] : Record<string, number[]>,
  model: string
}> => {
  type EmbeddingReturnType = T extends string ? number[] : Record<string, number[]>;

  if (isAnyTest) {
    return {
      embeddings: [] as unknown as EmbeddingReturnType,
      model: "test",
    };
  }

  const client = getVoyageClient();
  if (!client) {
    throw new Error("Voyage client is not configured");
  }

  const isBatch = typeof inputs === "object";

  try {
    const result = await client.embed({
      input: isBatch ? Object.values(inputs) : inputs,
      inputType,
      model: VOYAGE_MODEL,
    });

    if (isBatch) {
      const embeddings = result.data;
      if (!embeddings?.length || !embeddings.every((data): data is EmbedResponseDataItem & { embedding: number[] } => !!data.embedding?.length)) {
        throw new Error(`Invalid Voyage API response for batch embeddings`);
      }

      const ids = Object.keys(inputs);
      const mappedEmbeddings = Object.fromEntries(
        ids.map((id, idx) => [id, embeddings[idx].embedding])
      );

      return { embeddings: mappedEmbeddings as EmbeddingReturnType, model: VOYAGE_MODEL };
    } else {
      const embeddings = result.data?.[0].embedding;
      if (!embeddings?.length) {
        throw new Error(`Invalid Voyage API response for single embedding`);
      }
      return { embeddings: embeddings as EmbeddingReturnType, model: VOYAGE_MODEL };
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Voyage API error: ${err.message}`);
    }
    throw err;
  }
};

export const getEmbeddingsFromApi = async <T extends string | Record<string, string>>(inputs: T, inputType: 'document' | 'query' = 'document'): Promise<{
  embeddings: T extends string ? number[] : Record<string, number[]>,
  model: string
}> => {
  if (EMBEDDING_PROVIDER === "voyage") {
    return getEmbeddingsFromVoyage(inputs, inputType);
  }

  // Existing OpenAI implementation
  if (isAnyTest) {
    return {
      embeddings: [] as unknown as T extends string ? number[] : Record<string, number[]>,
      model: "test",
    };
  }
  
  const api = await getOpenAI();
  if (!api) {
    throw new Error("OpenAI client is not configured");
  }

  const { maxTokens, embeddingModel, tokenizerModel, dimensions } = commentEmbeddingsSettings;

  const isBatch = typeof inputs === "object";
  const trimmedInputs = isBatch
    ? Object.fromEntries(
        Object.entries(inputs)
          .map(([id, text]) => [id, trimText(text, tokenizerModel, maxTokens)])
          .filter(([_, text]) => !!text)
      )
    : trimText(inputs, tokenizerModel, maxTokens);

  if (isBatch && Object.keys(trimmedInputs).length === 0) {
    return { embeddings: {} as T extends string ? number[] : Record<string, number[]>, model: embeddingModel };
  }

  const result = await api.embeddings.create({
    input: isBatch ? Object.values(trimmedInputs) : trimmedInputs,
    model: embeddingModel,
    ...(dimensions && { dimensions })
  });

  if (isBatch) {
    const embeddingResults = result?.data;
    if (!embeddingResults?.length || embeddingResults.some(({embedding}) => !embedding?.length)) {
      throw new Error(`Invalid API response for batch embeddings`);
    }
    
    const orderedEmbeddings = embeddingResults
      .sort((a, b) => a.index - b.index)
      .map(({ embedding }) => embedding);
      
    const ids = Object.keys(trimmedInputs);
    const mappedEmbeddings = Object.fromEntries(
      ids.map((id, idx) => [id, orderedEmbeddings[idx]])
    );
    
    return { embeddings: mappedEmbeddings as T extends string ? number[] : Record<string, number[]>, model: embeddingModel };
  } else {
    const embeddings = result?.data?.[0].embedding;
    if (!embeddings?.length) {
      throw new Error(`Invalid API response for single embedding`);
    }
    return { embeddings: embeddings as T extends string ? number[] : Record<string, number[]>, model: embeddingModel };
  }
};

const enrichCommentDocumentForEmbedding = (comment: CommentsListWithParentMetadata) => {
  const text = htmlToTextDefault(comment.contents?.html ?? "");
  const { user, post } = comment;
  const parentPostTitleNode = `<parent-post-title>${post?.title}</parent-post-title>`;
  const commentAuthorNode = `<comment-author>${userGetDisplayName(user)}</comment-author>`;
  const commentTextNode = `<comment-text>${text}</comment-text>`;
  return `<comment>\n${parentPostTitleNode}\n${commentAuthorNode}\n${commentTextNode}\n</comment>`;
}

const getEmbeddingsForComment = async (comment: CommentsListWithParentMetadata): Promise<EmbeddingsWithHash> => {
  const enrichedComment = enrichCommentDocumentForEmbedding(comment);
  const { embeddings, model } = await getEmbeddingsFromApi(enrichedComment);
  const hash = md5(enrichedComment);
  return { hash, embeddings: embeddings, model };
};

const getEmbeddingsForComments = async (
  comments: CommentsListWithParentMetadata[]
): Promise<Record<string, EmbeddingsWithHash>> => {
  const textMappings: Record<string, string> = Object.fromEntries(
    comments.map((comment) => [
      comment._id,
      enrichCommentDocumentForEmbedding(comment)
    ]).filter(([_, text]) => !!text)
  );

  if (Object.keys(textMappings).length === 0) {
    return {};
  }
  
  const hashMappings = mapValues(textMappings, (text) => md5(text));
  const { embeddings, model } = await getEmbeddingsFromApi(textMappings);
  
  return mapValues(embeddings, (commentEmbeddings, commentId) => ({
    hash: hashMappings[commentId],
    embeddings: commentEmbeddings,
    model
  }));
};

export const updateCommentEmbeddings = async (commentId: string) => {
  const context = createAdminContext();
  const { currentUser, repos } = context;
  const comment = await fetchFragmentSingle({
    collectionName: 'Comments',
    fragmentName: 'CommentsListWithParentMetadata',
    selector: { _id: commentId },
    context,
    currentUser,
  });
  if (!comment) throw new Error(`Comment ${commentId} not found`);
  
  const { hash, embeddings, model } = await getEmbeddingsForComment(comment);
  await repos.commentEmbeddings.setCommentEmbeddings(commentId, hash, model, embeddings);
};

const batchUpdateCommentEmbeddings = async (comments: CommentsListWithParentMetadata[], context: ResolverContext) => {
  const { repos } = context;
  const commentEmbeddings = await getEmbeddingsForComments(comments);
  
  const updates = Object.entries(commentEmbeddings).map(([commentId, { hash, model, embeddings }]) => 
    repos.commentEmbeddings.setCommentEmbeddings(commentId, hash, model, embeddings)
  );

  // eslint-disable-next-line no-console
  console.log(`Updating ${updates.length} comment embeddings`);
  await Promise.all(updates);
};

export const updateMissingCommentEmbeddings = async () => {
  const context = createAdminContext();
  const { currentUser, repos } = context;

  let startDate = new Date("2023-01-29");
  let batchCount = 0;
  let comments: CommentsListWithParentMetadata[] = [];
  let first = true;
  while (comments.length || first) {
    batchCount++;
    // eslint-disable-next-line no-console
    console.log(`Comment embeddings batch ${batchCount}`);
    first = false;
    const ids = await repos.commentEmbeddings.getCommentIdsWithoutEmbeddings(startDate, 300);
    comments = await fetchFragment({
      collectionName: 'Comments',
      fragmentName: 'CommentsListWithParentMetadata',
      selector: { _id: { $in: ids } },
      context,
      currentUser,
    });
    // eslint-disable-next-line no-console
    console.log(`Found ${comments.length} comments for ${ids.length} ids`);
    await batchUpdateCommentEmbeddings(comments, context);
    startDate = comments[comments.length - 1]?.postedAt;
  }
};

Globals.updateCommentEmbeddings = updateCommentEmbeddings;
Globals.updateMissingCommentEmbeddings = updateMissingCommentEmbeddings;
