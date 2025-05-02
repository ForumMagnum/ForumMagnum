import { Application, Request, Response, json } from "express";
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

const onRequestError = (
  req: Request,
  res: Response,
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
  return res.status(status).send({error: message, errorCode});
}

const addHandler = <
  RequestSchema extends ZodType,
  ResponseSchema extends ZodType,
  RequestData extends z.infer<RequestSchema>,
  ResponseData extends z.infer<ResponseSchema>,
>(
  app: Application,
  route: FMCrosspostRoute<RequestSchema, ResponseSchema, RequestData, ResponseData>,
  requestHandler: (
    context: ResolverContext,
    requestData: RequestData,
  ) => Promise<ResponseData>,
) => {
  const path = route.getPath();
  app.use(path, json({ limit: "20mb" }));
  app.post(path, async (req: Request, res: Response) => {
    const parsedResult = route.getRequestSchema().safeParse(req.body);
    if (!parsedResult.success) {
      return onRequestError(req, res, path, 400, "Invalid cross-site request body");
    }

    let response: ResponseData;
    try {
      const context = await getContextFromReqAndRes({req, res, isSSR: false});
      response = await requestHandler(context, parsedResult.data);
    } catch (error) {
      const message = error.message ?? "Invalid cross-site request body";
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return onRequestError(req, res, path, 200, message, error);
    }

    const parsedResponse = route.getResponseSchema().safeParse(response);
    if (!parsedResponse.success) {
      // Return a 200 to avoid this triggering a health check failure,
      // the error is still handled on the server making the request
      return onRequestError(req, res, path, 200, "Invalid cross-site response body");
    }

    return res.status(200).send(parsedResponse.data);
  });
}

export const addV2CrosspostHandlers = (app: Application) => {
  addHandler(
    app,
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

  addHandler(
    app,
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

  addHandler(
    app,
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

  addHandler(
    app,
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

  addHandler(
    app,
    unlinkCrossposterRoute,
    async function unlinkCrossposterCrosspostHandler(context, {token}) {
      const {userId} = await connectCrossposterToken.verify(token);
      await context.Users.rawUpdateOne({_id: userId}, {
        $unset: {fmCrosspostUserId: ""},
      });
      return {status: "unlinked" as const};
    },
  );

  addHandler(
    app,
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
        },
      }, { ...context, currentUser: user, isFMCrosspostRequest: true });

      return {
        status: "posted" as const,
        postId: post._id,
      };
    },
  );

  addHandler(
    app,
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
}
