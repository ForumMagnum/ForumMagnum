import { gql } from "@/lib/generated/gql-codegen";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../post/postMarkdownUtils";

export interface MarkdownCollectionPostRouteConfig {
  documentId: string
  htmlPrefix: "/rationality" | "/codex" | "/hpmor"
  markdownPrefix: "/api/rationality" | "/api/codex" | "/api/hpmor"
}

const COLLECTION_POSTS_QUERY = gql(`
  query MarkdownCollectionPostsByDocumentId($documentId: String!) {
    collection(input: { selector: { documentId: $documentId } }) {
      result {
        _id
        books {
          _id
          posts {
            _id
            slug
          }
          sequences {
            _id
            chapters {
              _id
              posts {
                _id
                slug
              }
            }
          }
        }
      }
    }
  }
`);

interface MatchedCollectionPost {
  postId: string
  sequenceId?: string
}

function findCollectionPostBySlug(
  collection: NonNullable<MarkdownCollectionPostsByDocumentIdQuery["collection"]>["result"],
  slug: string
): MatchedCollectionPost | null {
  for (const book of collection?.books ?? []) {
    if (!book) continue;
    for (const post of book.posts ?? []) {
      if (post?.slug === slug) {
        return { postId: post._id };
      }
    }
    for (const sequence of book.sequences ?? []) {
      if (!sequence) continue;
      for (const chapter of sequence.chapters ?? []) {
        if (!chapter) continue;
        for (const post of chapter.posts ?? []) {
          if (post?.slug === slug) {
            return {
              postId: post._id,
              sequenceId: sequence._id,
            };
          }
        }
      }
    }
  }
  return null;
}

export async function renderCollectionPostMarkdownBySlug(
  req: NextRequest,
  slug: string,
  config: MarkdownCollectionPostRouteConfig
): Promise<Response> {
  if (!slug) {
    return new Response("No slug provided", { status: 400 });
  }

  const resolverContext = await getContextFromReqAndRes({ req });
  const { data } = await runQuery(COLLECTION_POSTS_QUERY, {
    documentId: config.documentId,
  }, resolverContext);
  const collection = data?.collection?.result;
  const matchedPost = collection ? findCollectionPostBySlug(collection, slug) : null;

  if (!matchedPost) {
    return new Response(`No post found for slug '${slug}' in ${config.htmlPrefix}`, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return await renderPostMarkdownByIdOrSlug(req, matchedPost.postId, {
    sequenceId: matchedPost.sequenceId,
    htmlPathOverride: `${config.htmlPrefix}/${slug}`,
    markdownPathOverride: `${config.markdownPrefix}/${slug}`,
  });
}
