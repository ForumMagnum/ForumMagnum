import { NextRequest } from "next/server";
import { GraphQLError } from "graphql";
import { gql } from "@/lib/generated/gql-codegen";
import { isLWorAF } from "@/lib/forumTypeUtils";
import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { getBibtexKey, getPostBibtex, getPostCitation } from "@/lib/collections/posts/citations";

const PostCitationQuery = gql(`
  query PostCitation($postId: String) {
    post(selector: { _id: $postId }) {
      result {
        ...PostsCitationInfo
      }
    }
  }
`);

// The single-post resolver signals "not yours to see" and "no such post" with
// these ids (see server/resolvers/defaultResolvers.ts); anything else that
// escapes runQuery is a real failure and must not masquerade as a 404, or a
// reference manager hitting a transient outage would drop the entry.
const NOT_VISIBLE_ERROR_IDS = new Set(["app.operation_not_allowed", "app.missing_document"]);

function isNotVisibleError(error: unknown): boolean {
  return error instanceof GraphQLError && NOT_VISIBLE_ERROR_IDS.has(error.message);
}

async function loadCitablePost(req: NextRequest, idOrSlug: string): Promise<PostsCitationInfo | null> {
  const resolverContext = await getContextFromReqAndRes({ req });
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return null;
  }
  try {
    // Going through the GraphQL layer applies the usual post visibility
    // permissions; the single-post resolver throws for posts the requester
    // may not see.
    const { data } = await runQuery(PostCitationQuery, { postId: rawPost._id }, resolverContext);
    return data?.post?.result ?? null;
  } catch (error) {
    if (isNotVisibleError(error)) {
      return null;
    }
    throw error;
  }
}

/**
 * Serves a post's citation as a downloadable BibTeX file. Posts that don't
 * exist and posts the requester isn't allowed to see both return 404. The
 * citation tools are a LessWrong / Alignment Forum feature, so other forums
 * answer 404 for every post.
 */
export async function getPostBibtexResponse(req: NextRequest, idOrSlug: string): Promise<Response> {
  if (!isLWorAF()) {
    return new Response("Not found", { status: 404 });
  }
  if (!idOrSlug) {
    return new Response("No ID or slug provided", { status: 400 });
  }
  const post = await loadCitablePost(req, idOrSlug);
  if (!post) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  const citation = getPostCitation(post);
  const bibtex = getPostBibtex(citation, post._id, new Date());
  const filename = `${getBibtexKey(citation, post._id)}.bib`;
  return new Response(bibtex, {
    status: 200,
    headers: {
      "content-type": "application/x-bibtex; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
