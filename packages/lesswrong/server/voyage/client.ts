import { htmlToTextDefault } from "@/lib/htmlToText";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { isAnyTest } from "@/lib/executionEnvironment";
import mapValues from "lodash/mapValues";
import { VoyageAIClient } from "voyageai";
import { EmbedResponseDataItem } from "voyageai/api/types";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { gql } from "@/lib/generated/gql-codegen";
import { getApolloClientWithContext } from "../rendering/ssrApolloClient";
import { maybeDate } from "@/lib/utils/dateUtils";
import chunk from "lodash/chunk";

type EmbeddingsResult = {
  embeddings: number[],
  model: string,
}

const VOYAGE_MODEL = "voyage-3-large" as const;

const commentsForEmbeddingsQuery = gql(`
  query CommentsForEmbeddings($selector: CommentSelector) {
    comments(selector: $selector) {
      results {
        _id
        postedAt
        contents {
          _id
          html
        }
        user {
          _id
          displayName
          username
          fullName
        }
        post {
          _id
          title
        }
      }
    }
  }
`);

type EmbeddingCommentInfo = CommentsForEmbeddingsQuery_comments_MultiCommentOutput_results_Comment;

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
  return getEmbeddingsFromVoyage(inputs, inputType);
};

const enrichCommentDocumentForEmbedding = (comment: EmbeddingCommentInfo) => {
  const text = htmlToTextDefault(comment.contents?.html ?? "");
  const { user, post } = comment;
  const parentPostTitleNode = `<parent-post-title>${post?.title}</parent-post-title>`;
  const commentAuthorNode = `<comment-author>${userGetDisplayName(user)}</comment-author>`;
  const commentTextNode = `<comment-text>${text}</comment-text>`;
  return `<comment>\n${parentPostTitleNode}\n${commentAuthorNode}\n${commentTextNode}\n</comment>`;
}

const getEmbeddingsForComment = async (comment: EmbeddingCommentInfo): Promise<EmbeddingsResult> => {
  const enrichedComment = enrichCommentDocumentForEmbedding(comment);
  const { embeddings, model } = await getEmbeddingsFromVoyage(enrichedComment, 'document');
  return { embeddings: embeddings, model };
};

const getEmbeddingsForComments = async (
  comments: EmbeddingCommentInfo[]
): Promise<Record<string, EmbeddingsResult>> => {
  const textMappings: Record<string, string> = Object.fromEntries(
    comments.map((comment) => [
      comment._id,
      enrichCommentDocumentForEmbedding(comment)
    ]).filter(([_, text]) => !!text)
  );

  if (Object.keys(textMappings).length === 0) {
    return {};
  }
  
  const { embeddings, model } = await getEmbeddingsFromVoyage(textMappings, 'document');
  
  return mapValues(embeddings, (commentEmbeddings, commentId) => ({
    embeddings: commentEmbeddings,
    model
  }));
};

export const updateCommentEmbeddings = async (commentId: string) => {
  const context = createAdminContext();
  const { repos } = context;
  const apolloClient = await getApolloClientWithContext(context);

  const { data } = await apolloClient.query({
    query: commentsForEmbeddingsQuery,
    variables: { selector: { default: { commentIds: [commentId] } } },
  });

  const comment = data?.comments?.results?.[0];
  if (!comment) throw new Error(`Comment ${commentId} not found`);
  
  const { embeddings, model } = await getEmbeddingsForComment(comment);
  await repos.commentEmbeddings.setCommentEmbeddings(commentId, model, embeddings);
};

const batchUpdateCommentEmbeddings = async (comments: EmbeddingCommentInfo[], context: ResolverContext) => {
  const { repos } = context;
  const commentEmbeddings = await getEmbeddingsForComments(comments);
  
  const updates = Object.entries(commentEmbeddings).map(([commentId, { model, embeddings }]) => 
    repos.commentEmbeddings.setCommentEmbeddings(commentId, model, embeddings)
  );

  // eslint-disable-next-line no-console
  console.log(`Updating ${updates.length} comment embeddings`);
  await Promise.all(updates);
};

export const updateMissingCommentEmbeddings = async () => {
  const context = createAdminContext();
  const { repos } = context;

  const apolloClient = await getApolloClientWithContext(context);

  let startDate = new Date("2023-01-29");
  const commentsWithoutEmbeddings = await repos.commentEmbeddings.getAllCommentIdsWithoutEmbeddings(startDate);
  const batches = chunk(commentsWithoutEmbeddings, 300);

  let batchCount = 0;
  for (const batch of batches) {
    batchCount++;
    // eslint-disable-next-line no-console
    console.log(`Comment embeddings batch ${batchCount}`);

    const ids = batch.map(({ _id }) => _id);

    const { data } = await apolloClient.query({
      query: commentsForEmbeddingsQuery,
      variables: { selector: { default: { commentIds: ids } } },
    });
    
    const comments = data?.comments?.results ?? [];

    // eslint-disable-next-line no-console
    console.log(`Found ${comments.length} comments for ${ids.length} ids`);
    await batchUpdateCommentEmbeddings(comments, context);
    startDate = maybeDate(comments[comments.length - 1]?.postedAt);
  }
};
