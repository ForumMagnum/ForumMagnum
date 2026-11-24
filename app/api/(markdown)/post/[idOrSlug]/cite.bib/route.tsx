import { NextRequest } from "next/server";
import { GraphQLError } from "graphql";
import { gql } from "@/lib/generated/gql-codegen";
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

async function loadCitablePost(idOrSlug: string, resolverContext: ResolverContext): Promise<PostsCitationInfo | null> {
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return null;
  }
  try {
    // Going through the GraphQL layer applies the usual post visibility permissions
    const { data } = await runQuery(PostCitationQuery, { postId: rawPost._id }, resolverContext);
    return data?.post?.result ?? null;
  } catch (error) {
    if (error instanceof GraphQLError && NOT_VISIBLE_ERROR_IDS.has(error.message)) {
      return null;
    }
    throw error;
  }
}

/**
 * Serves a post's citation as a downloadable BibTeX file. Posts that don't
 * exist and posts the requester isn't allowed to see both return 404.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  const resolverContext = await getContextFromReqAndRes({ req });
  const post = await loadCitablePost(idOrSlug, resolverContext);
  if (!post) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  const citation = getPostCitation(post, resolverContext.forumType);
  const filename = `${getBibtexKey(citation, post._id)}.bib`;
  return new Response(getPostBibtex(citation, post._id, new Date()), {
    headers: {
      "content-type": "application/x-bibtex; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
