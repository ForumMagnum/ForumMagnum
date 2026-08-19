import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { updatePost } from "@/server/collections/posts/mutations";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAgentDraftAccess } from "../editorAgentUtil";
import { setPostFieldsRouteSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import {
  accessLevelCan,
  getCollaborativeEditorAccessWithKey,
} from "@/lib/collections/posts/collabEditingPermissions";

interface PostFieldsUpdate {
  title?: string;
  url?: string | null;
}

interface SetPostFieldsSuccess {
  updated: true;
  title: string;
  url: string | null;
}

interface SetPostFieldsFailure {
  updated: false;
  error: string;
  status: 400 | 403 | 404;
}

export function getPostFieldsUpdateError(
  post: Pick<DbPost, "draft" | "postCategory">,
  fields: PostFieldsUpdate,
): string | null {
  if (!post.draft) {
    return "Post metadata can only be changed through the agent API while the post is a draft.";
  }
  if (fields.url !== undefined && post.postCategory !== "linkpost") {
    return "The url field can only be changed on linkpost drafts.";
  }
  return null;
}

export async function setAgentPostFields({
  postId,
  title,
  url,
  linkSharingKey,
  context,
}: {
  postId: string;
  title?: string;
  url?: string | null;
  linkSharingKey?: string;
  context: ResolverContext;
}): Promise<SetPostFieldsSuccess | SetPostFieldsFailure> {
  const post = await context.Posts.findOne(postId);
  if (!post) {
    return { updated: false, error: "Post not found.", status: 404 };
  }

  const accessLevel = await getCollaborativeEditorAccessWithKey({
    formType: "edit",
    post,
    user: context.currentUser,
    context,
    useAdminPowers: true,
    linkSharingKey: linkSharingKey ?? null,
  });
  if (!accessLevelCan(accessLevel, "edit")) {
    return {
      updated: false,
      error: "Edit access is required to update post metadata.",
      status: 403,
    };
  }

  const fields = { title, url };
  const validationError = getPostFieldsUpdateError(post, fields);
  if (validationError) {
    return { updated: false, error: validationError, status: 400 };
  }

  const data: Partial<DbPost> = {};
  if (title !== undefined) {
    data.title = title;
  }
  if (url !== undefined) {
    data.url = url;
  }

  const updatedPost = await updatePost({
    selector: { _id: postId },
    data,
  }, context);

  return {
    updated: true,
    title: updatedPost.title,
    url: updatedPost.url ?? null,
  };
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = setPostFieldsRouteSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({
      route: "setPostFields",
      postId: body?.postId,
      userId: context.currentUser?._id,
      agentName: body?.agentName,
      status: "validation_error",
    });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { postId, key, agentName, title, url } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({
      route: "setPostFields",
      postId,
      context,
      linkSharingKey: key,
      agentName,
    });
    if ("errorResponse" in auth) return auth.errorResponse;

    const result = await setAgentPostFields({
      postId,
      title,
      url,
      linkSharingKey: key,
      context,
    });
    if (!result.updated) {
      captureAgentApiEvent({
        route: "setPostFields",
        postId,
        userId: context.currentUser?._id,
        agentName,
        status: result.status === 403 ? "unauthorized" : "validation_error",
      });
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    captureAgentApiEvent({
      route: "setPostFields",
      postId,
      userId: context.currentUser?._id,
      agentName,
      status: "success",
      operationResult: "updated",
    });
    return NextResponse.json({
      ok: true,
      postId,
      updated: true,
      title: result.title,
      url: result.url,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("setPostFields", error, {
      postId,
      userId: context.currentUser?._id,
      agentName,
    });
    return NextResponse.json(
      {
        error: "Failed to update post fields",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
