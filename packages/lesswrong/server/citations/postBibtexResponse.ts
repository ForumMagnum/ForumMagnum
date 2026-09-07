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
        }
        coauthors {
          _id
          displayName
        }
      }
    }
  }
`);

/**
 * Serves a post's citation as a downloadable BibTeX file. Goes through the
 * GraphQL layer so that the usual post visibility permissions apply.
 */
export async function getPostBibtexResponse(req: NextRequest, idOrSlug: string): Promise<Response> {
  if (!idOrSlug) {
    return new Response("No ID or slug provided", { status: 400 });
  }
  const resolverContext = await getContextFromReqAndRes({ req });
  const rawPost = await findPostByIdOrSlug(idOrSlug, resolverContext);
  if (!rawPost) {
    return new Response("No post found with ID or slug: " + idOrSlug, { status: 404 });
  }

  const { data } = await runQuery(PostCitationQuery, { postId: rawPost._id }, resolverContext);
  const post = data?.post?.result;
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
