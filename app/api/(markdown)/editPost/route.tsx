import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import { canUserEditPostMetadata } from "@/lib/collections/posts/helpers";
import { userIsPodcaster } from "@/lib/vulcan-users/permissions";
import {
  buildCollaborateMarkdownUrl,
  buildEditMarkdownUrl,
  markdownRouteRedirect,
  renderEditorDraftMarkdown,
} from "../editorMarkdownUtils";
import { gql } from "@/lib/generated/gql-codegen";

const MarkdownPostEditQuery = gql(`
  query MarkdownPostsEdit($documentId: String, $contentsVersion: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsEdit
        contents(version: $contentsVersion) {
          agentMarkdown
        }
      }
    }
  }
`);

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  const key = req.nextUrl.searchParams.get("key") ?? undefined;
  const version = req.nextUrl.searchParams.get("version") ?? "draft";

  if (!postId) {
    return new Response("No postId provided", { status: 400 });
  }

  const resolverContext = await getContextFromReqAndRes({ req });
  const { data } = await runQuery(
    MarkdownPostEditQuery,
    { documentId: postId, contentsVersion: version },
    resolverContext
  );
  const post = data?.post?.result;

  if (post && !canUserEditPostMetadata(resolverContext.currentUser, post) && !userIsPodcaster(resolverContext.currentUser)) {
    return markdownRouteRedirect(req, buildCollaborateMarkdownUrl(postId, key));
  }

  if (!post && key) {
    return markdownRouteRedirect(req, buildCollaborateMarkdownUrl(postId, key));
  }

  if (post?.linkSharingKey && !key) {
    return markdownRouteRedirect(req, buildEditMarkdownUrl(post._id, post.linkSharingKey, version));
  }

  if (!post) {
    return new Response("No post found or access denied for postId: " + postId, { status: 404 });
  }

  return renderEditorDraftMarkdown({
    title: post.title,
    mode: "edit",
    postId: post._id,
    key,
    version,
    bodyMarkdown: post.contents?.agentMarkdown ?? "",
  });
}
