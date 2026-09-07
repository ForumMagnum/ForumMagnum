import { NextRequest } from "next/server";
import { gql } from "@/lib/generated/gql-codegen";
import { findPostByIdOrSlug } from "@/server/markdownApi/apiUtil";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { getBibtexKey, getPostBibtex, getPostCitation } from "@/lib/collections/posts/citations";

const PostCitationQuery = gql(`
  query PostCitation($postId: String) {
    post(selector: { _id: $postId }) {
      result {
        _id
        slug
        title
        postedAt
        isEvent
        groupId
        hideAuthor
        user {
          _id
          displayName
          deleted
        }
        coauthors {
          _id
          displayName
          deleted
        }
      }
    }
  }
`);

async function loadCitablePost(req: NextRequest, idOrSlug: string): Promise<PostCitationQuery_post_SinglePostOutput_result_Post | null> {
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
  } catch {
    return null;
  }
}

/**
 * Serves a post's citation as a downloadable BibTeX file. Posts that don't
 * exist and posts the requester isn't allowed to see both return 404.
 */
export async function getPostBibtexResponse(req: NextRequest, idOrSlug: string): Promise<Response> {
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
