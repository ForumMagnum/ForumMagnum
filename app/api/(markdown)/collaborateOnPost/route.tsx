import { gql } from "@/lib/generated/gql-codegen";
import { canUserEditPostMetadata } from "@/lib/collections/posts/helpers";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest } from "next/server";
import {
  buildCollaborateMarkdownUrl,
  buildEditMarkdownUrl,
  markdownRouteRedirect,
  renderEditorDraftMarkdown,
} from "../editorMarkdownUtils";

const LinkSharedPostMarkdownQuery = gql(`
  query LinkSharedPostMarkdownQuery($postId: String!, $linkSharingKey: String!) {
    getLinkSharedPost(postId: $postId, linkSharingKey: $linkSharingKey) {
      ...PostsEdit
      contents {
        agentMarkdown
      }
    }
  }
`);

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  const key = req.nextUrl.searchParams.get("key") ?? "";

  if (!postId) {
    return new Response("No postId provided", { status: 400 });
  }

  const resolverContext = await getContextFromReqAndRes({ req });

  try {
    const { data } = await runQuery(
      LinkSharedPostMarkdownQuery,
      { postId, linkSharingKey: key },
      resolverContext
    );
    const post = data?.getLinkSharedPost;

    if (!post) {
      return new Response("No accessible shared draft found for postId: " + postId, { status: 403 });
    }

    if (canUserEditPostMetadata(resolverContext.currentUser, post)) {
      return markdownRouteRedirect(req, buildEditMarkdownUrl(post._id, post.linkSharingKey ?? key));
    }

    if (post.linkSharingKey && !key) {
      return markdownRouteRedirect(req, buildCollaborateMarkdownUrl(post._id, post.linkSharingKey));
    }

    return renderEditorDraftMarkdown({
      title: post.title,
      mode: "collaborate",
      postId: post._id,
      key,
      bodyMarkdown: post.contents?.agentMarkdown ?? "",
    });
  } catch {
    return new Response("Unable to access shared draft for postId: " + postId, { status: 403 });
  }
}
