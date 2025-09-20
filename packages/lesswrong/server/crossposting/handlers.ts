import { ZodType, z } from "zod";
import { getContextFromReqAndRes } from "../vulcan-lib/apollo-server/context";
import { assertCrosspostingKarmaThreshold } from "@/server/fmCrosspost/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import {
  ApiError,
  InvalidPostError,
  InvalidUserError,
  UnauthorizedError,
} from "@/server/fmCrosspost/errors";
import {
  connectCrossposterToken,
  createCrosspostToken,
  updateCrosspostToken,
} from "@/server/crossposting/tokens";
import {
  FMCrosspostRoute,
  crossposterDetailsRoute,
  crosspostDetailsRoute,
  generateTokenRoute,
  connectCrossposterRoute,
  unlinkCrossposterRoute,
  createCrosspostRoute,
  updateCrosspostRoute,
} from "@/lib/fmCrosspost/routes";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { createPost, updatePost } from "../collections/posts/mutations";
import Posts from "@/server/collections/posts/collection";
import Users from "@/server/collections/users/collection";
import { fmCrosspostBaseUrlSetting } from "@/lib/instanceSettings";
import { NextRequest, NextResponse } from "next/server";

const setCorsHeaders = (res: NextResponse) => {
  const foreignBaseUrl = fmCrosspostBaseUrlSetting.get()?.replace(/\/$/, "");
  if (foreignBaseUrl) {
    res.headers.set("Access-Control-Allow-Origin", foreignBaseUrl);
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
};

const onNextRequestError = (
  req: NextRequest,
  routePath: string,
  status: number,
  message: string,
  error?: AnyBecauseIsInput,
) => {
  const errorCode = error instanceof ApiError ? error.code : undefined;
  // eslint-disable-next-line no-console
  console.error("Crossposting error:", message, {
    body: req.body,
    routePath,
    status,
    errorCode,
    error,
  });

  const res = NextResponse.json({ error: message, errorCode }, { status });
  setCorsHeaders(res);
  
  return res;
};

export const crosspostOptionsHandler = (req: NextRequest) => {
  const res = new NextResponse(null, { status: 204 });
  setCorsHeaders(res);
  res.headers.set("Connection", "Keep-Alive");
  res.headers.set("Keep-Alive", "timeout=2, max=100");
  return res;
};

const getNextHandler = <
  RequestSchema extends ZodType,
  ResponseSchema extends ZodType,
  RequestData extends z.infer<RequestSchema>,
  ResponseData extends z.infer<ResponseSchema>,
>(
  route: FMCrosspostRoute<RequestSchema, ResponseSchema, RequestData, ResponseData>,
  requestHandler: (
    context: ResolverContext,
    requestData: RequestData,
  ) => Promise<ResponseData>,
) => {
  return async (req: NextRequest) => {
    const path = route.getPath();
    const body = await req.json();
    const parsedResult = route.getRequestSchema().safeParse(body);
    if (!parsedResult.success) {
      return onNextRequestError(req, path, 400, "Invalid cross-site request body");
    }

    let response: ResponseData;
    try {
      const context = await getContextFromReqAndRes({req, isSSR: false});
      response = await requestHandler(context, parsedResult.data);
    } catch (error) {
      const message = error.message ?? "Invalid cross-site request body";
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return onNextRequestError(req, path, 200, message, error);
    }

    const parsedResponse = route.getResponseSchema().safeParse(response);
    if (!parsedResponse.success) {
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return onNextRequestError(req, path, 200, "Invalid cross-site response body");
    }

    const res = NextResponse.json(parsedResponse.data, { status: 200 });
    setCorsHeaders(res);
    
    return res;
  };
};

export const crossposterDetailsCrosspostHandler = getNextHandler(
  crossposterDetailsRoute,
  async function crossposterDetailsCrosspostHandler(context, { userId }) {
    const rawUser = await context.loaders.Users.load(userId);
    if (!rawUser) {
      throw new InvalidUserError();
    }
    const user = await accessFilterSingle(
      context.currentUser,
      "Users",
      rawUser,
      context,
    );
    if (!user) {
      throw new InvalidUserError();
    }
    return {
      displayName: user.displayName ?? user.username ?? "",
      slug: user.slug ?? "",
    };
  },
);

export const crosspostDetailsCrosspostHandler = getNextHandler(
  crosspostDetailsRoute,
  async function crosspostDetailsCrosspostHandler(context, { postId }) {
    const rawPost = await context.loaders.Posts.load(postId);
    if (!rawPost.fmCrosspost?.isCrosspost) {
      throw new InvalidPostError();
    }
    const post = await accessFilterSingle(
      context.currentUser,
      "Posts",
      rawPost,
      context,
    );
    if (!post) {
      throw new InvalidPostError();
    }
    return {
      canonicalLink: postGetPageUrl(post as DbPost, true),
      commentCount: Math.max(post.commentCount ?? 0, 0),
    };
  },
);

export const generateTokenCrosspostHandler = getNextHandler(
  generateTokenRoute,
  async function generateTokenCrosspostHandler({currentUser}, _payload) {
    if (!currentUser) {
      throw new UnauthorizedError();
    }
    assertCrosspostingKarmaThreshold(currentUser);
    const token = await connectCrossposterToken.create({
      userId: currentUser._id,
    });
    return {token};
  },
);

export const connectCrossposterCrosspostHandler = getNextHandler(
  connectCrossposterRoute,
  async function connectCrossposterCrosspostHandler(context, {
    token,
    localUserId,
  }) {
    const {userId: foreignUserId} = await connectCrossposterToken.verify(token);
    await context.Users.rawUpdateOne({_id: foreignUserId}, {
      $set: {fmCrosspostUserId: localUserId},
    });
    return {
      status: "connected" as const,
      foreignUserId,
      localUserId,
    };
  },
);

export const unlinkCrossposterCrosspostHandler = getNextHandler(
  unlinkCrossposterRoute,
  async function unlinkCrossposterCrosspostHandler(context, {token}) {
    const {userId} = await connectCrossposterToken.verify(token);
    await context.Users.rawUpdateOne({_id: userId}, {
      $unset: {fmCrosspostUserId: ""},
    });
    return {status: "unlinked" as const};
  },
);

export const createCrosspostCrosspostHandler = getNextHandler(
  createCrosspostRoute,
  async function createCrosspostHandler(context, {token}) {
    const {
      localUserId,
      foreignUserId,
      postId,
      ...postData
    } = await createCrosspostToken.verify(token);

    const user = await context.Users.findOne({_id: foreignUserId});
    if (!user || user.fmCrosspostUserId !== localUserId) {
      throw new InvalidUserError();
    }

    const post = await createPost({
      data: {
        userId: user._id,
        fmCrosspost: {
          isCrosspost: true,
          hostedHere: false,
          foreignPostId: postId,
        },
        ...postData,
        contents: {
          ...postData.contents,
          originalContents: postData.contents?.originalContents ?? {
            type: "ckEditorMarkup",
            data: "",
          },
        },
      },
    }, { ...context, currentUser: user, isFMCrosspostRequest: true });

    return {
      status: "posted" as const,
      postId: post._id,
    };
  },
);

export const updateCrosspostCrosspostHandler = getNextHandler(
  updateCrosspostRoute,
  async function updateCrosspostHandler(context, {token}) {
    const {postId, ...postData} = await updateCrosspostToken.verify(token);

    const post = await Posts.findOne({_id: postId});
    if (!post) {
      throw new InvalidPostError();
    }

    const currentUser = await Users.findOne({_id: post.userId});
    if (!currentUser) {
      throw new InvalidUserError();
    }

    await updatePost({
      selector: {_id: postId},
      data: postData,
    }, {...context, currentUser});

    return {status: "updated" as const};
  },
);
