import { DatabaseServerSetting } from "./databaseSettings";
import { Utils, addGraphQLMutation, addGraphQLSchema, addGraphQLResolvers } from "../lib/vulcan-lib";
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import { randomId } from "../lib/random";
import Users from "../lib/collections/users/collection";
import Posts from "../lib/collections/posts/collection";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import type { Application, Request, Response } from "express";

const crosspostSigningKeySetting = new DatabaseServerSetting<string|null>("fmCrosspostSigningKey", null);

const jwtSigningOptions = {
  algorithm: "HS256",
  expiresIn: "30m",
} as const;

const apiRoutes = {
  crosspostToken: "/api/crosspostToken",
  connectCrossposter: "/api/connectCrossposter",
  unlinkCrossposter: "/api/unlinkCrossposter",
  crosspost: "/api/crosspost",
  crosspostDraftStatus: "/api/crosspostDraftStatus",
} as const;

type ApiRoute = typeof apiRoutes[keyof typeof apiRoutes];

type ConnectCrossposterArgs = {
  token: string,
}

type ConnectCrossposterPayload = {
  userId: string,
}

type UnlinkCrossposterPayload = {
  userId: string,
}

type CrosspostDraftStatusPayload = {
  postId: string,
  draft: boolean,
  deletedDraft: boolean,
}

type CrosspostPayload = {
  localUserId: string,
  foreignUserId: string,
}

type Crosspost = Pick<DbPost, "_id" | "title" | "userId" | "fmCrosspost" | "draft">;

class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

class UnauthorizedError extends ApiError {
  constructor() {
    super(403, "You must login to do this");
  }
}

class MissingSecretError extends ApiError {
  constructor() {
    super(500, "Missing crosspost signing secret env var");
  }
}

class MissingParametersError extends ApiError {
  constructor(expectedParams: string[], body: any) {
    super(400, `Missing parameters: expected ${JSON.stringify(expectedParams)} but received ${JSON.stringify(body)}`);
  }
}

class InvalidTokenError extends ApiError {
  constructor() {
    super(400, "Invalid token");
  }
}

class InvalidUserError extends ApiError {
  constructor() {
    super(400, "Invalid user");
  }
}

const getSecret = () => {
  const secret = crosspostSigningKeySetting.get();
  if (!secret) {
    throw new MissingSecretError();
  }
  return secret;
}

const getUserId = (req?: Request) => {
  const userId = req?.user?._id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

const makeApiUrl = (route: ApiRoute) => fmCrosspostBaseUrlSetting.get() + route.slice(1);

const makeCrossSiteRequest = async <T extends {}>(
  route: ApiRoute,
  body: T,
  expectedStatus: string,
  onErrorMessage: string,
) => {
  const result = await fetch(makeApiUrl(route), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await result.json();
  if (json.status !== expectedStatus) {
    throw new ApiError(500, onErrorMessage);
  }
  return json;
}

const signToken = <T extends {}>(payload: T): string =>
  jwt.sign(payload, getSecret(), jwtSigningOptions);

const verifyToken = <T extends {}>(token: string): T =>
  jwt.verify(token, getSecret()) as T;

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      root: void,
      {token}: ConnectCrossposterArgs,
      {req, res}: ResolverContext,
    ) => {
      const localUserId = getUserId(req);
      const {foreignUserId} = await makeCrossSiteRequest(
        apiRoutes.connectCrossposter,
        {token, localUserId},
        "connected",
        "Failed to connect accounts for crossposting",
      );
      await Users.rawUpdateOne({_id: localUserId}, {
        $set: {fmCrosspostUserId: foreignUserId},
      });
      return "success";
    },
    unlinkCrossposter: async (root: void, args: {}, {req, res}: ResolverContext) => {
      const localUserId = getUserId(req);
      const foreignUserId = req?.user?.fmCrosspostUserId;
      if (foreignUserId) {
        const token = signToken<UnlinkCrossposterPayload>({userId: foreignUserId});
        await makeCrossSiteRequest(
          apiRoutes.unlinkCrossposter,
          {token},
          "unlinked",
          "Failed to unlink crossposting accounts",
        );
        await Users.rawUpdateOne({_id: localUserId}, {
          $unset: {fmCrosspostUserId: ""},
        });
      }
      return "success";
    },
  },
};

addGraphQLResolvers(crosspostResolvers);
addGraphQLMutation("connectCrossposter(token: String): String");
addGraphQLMutation("unlinkCrossposter: String");

const updateCrosspostDraftStatus = async (post: DbPost) => {
  if (!post.fmCrosspost?.foreignPostId || post.fmCrosspost?.hostedHere) {
    return;
  }
  const token = signToken<CrosspostDraftStatusPayload>({
    postId: post.fmCrosspost.foreignPostId,
    draft: post.draft,
    deletedDraft: post.deletedDraft,
  });
  await makeCrossSiteRequest(
    apiRoutes.crosspostDraftStatus,
    {token},
    "updated",
    "Failed to update crosspost draft status",
  );
}

const withApiErrorHandlers = (callback: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response) => {
    try {
      await callback(req, res);
    } catch (e) {
      res
        .status(e instanceof ApiError ? e.code : 500)
        .send({error: e.message ?? "An unknown error occurred"})
    }
  }

const getPostParams = (req: Request, paramNames: string[]) => {
  const params = paramNames.map((name) => req.body[name])
  if (params.some((param) => !param)) {
    throw new MissingParametersError(paramNames, req.body);
  }
  return params;
}

const onCrosspostTokenRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const {user} = req;
  if (!user) {
    throw new UnauthorizedError();
  }

  const token = signToken<ConnectCrossposterPayload>({userId: user._id});
  res.send({token});
});

const onConnectCrossposterRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token, localUserId] = getPostParams(req, ["token", "localUserId"]);
  const payload = verifyToken<ConnectCrossposterPayload>(token);
  if (!payload?.userId) {
    throw new InvalidTokenError();
  }
  const {userId: foreignUserId} = payload;
  await Users.rawUpdateOne({_id: foreignUserId}, {
    $set: {fmCrosspostUserId: localUserId},
  });
  res.send({
    status: "connected",
    foreignUserId,
    localUserId,
  });
});

const onUnlinkCrossposterRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token] = getPostParams(req, ["token"]);
  const payload = verifyToken<UnlinkCrossposterPayload>(token);
  if (!payload?.userId) {
    throw new InvalidTokenError();
  }
  const {userId} = payload;
  await Users.rawUpdateOne({_id: userId}, {
    $unset: {fmCrosspostUserId: ""},
  });
  res.send({status: "unlinked"});
});

const onCrosspostRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token, postId, postTitle] = getPostParams(req, ["token", "postId", "postTitle"]);
  const payload = verifyToken<CrosspostPayload>(token);
  const {localUserId, foreignUserId} = payload;
  if (!localUserId || !foreignUserId) {
    throw new InvalidTokenError();
  }

  const user = await Users.findOne({_id: foreignUserId});
  if (!user) {
    throw new InvalidUserError();
  }

  const document: Partial<DbPost> = {
    title: postTitle,
    userId: user._id,
    fmCrosspost: {
      isCrosspost: true,
      hostedHere: false,
      foreignPostId: postId,
    },
  };

  const {data: post} = await Utils.createMutator({
    document,
    collection: Posts,
    validate: true,
    currentUser: user,
    context: {
      currentUser: user,
      Users,
    },
  });

  res.send({
    status: "posted",
    postId: post._id,
  });
});

const onCrosspostDraftStatusRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token] = getPostParams(req, ["token"]);
  const payload = verifyToken<CrosspostDraftStatusPayload>(token);
  const {postId, draft, deletedDraft} = payload;
  if (!postId || typeof draft !== "boolean" || typeof deletedDraft !== "boolean") {
    throw new InvalidTokenError();
  }
  await Posts.rawUpdateOne({_id: postId}, {$set: {draft, deletedDraft}});
  res.send({status: "updated"});
});

export const addCrosspostRoutes = (app: Application) => {
  const addPostRoute = (route: string, callback: (req: Request, res: Response) => Promise<void>) => {
    app.use(route, bodyParser.json({ limit: "1mb" }));
    app.post(route, callback);
  }
  app.get(apiRoutes.crosspostToken, onCrosspostTokenRequest);
  addPostRoute(apiRoutes.connectCrossposter, onConnectCrossposterRequest);
  addPostRoute(apiRoutes.unlinkCrossposter, onUnlinkCrossposterRequest);
  addPostRoute(apiRoutes.crosspost, onCrosspostRequest);
  addPostRoute(apiRoutes.crosspostDraftStatus, onCrosspostDraftStatusRequest);
}

export const performCrosspost = async <T extends Crosspost>(post: T): Promise<T> => {
  if (!post.fmCrosspost || !post.userId || post.draft) {
    return post;
  }

  const {isCrosspost, hostedHere, foreignPostId} = post.fmCrosspost;
  if (!isCrosspost || !hostedHere || foreignPostId) {
    return post;
  }

  const user = await Users.findOne({_id: post.userId});
  if (!user || !user.fmCrosspostUserId) {
    throw new Error("You have not connected a crossposting account yet");
  }

  const token = signToken<CrosspostPayload>({
    localUserId: post.userId,
    foreignUserId: user.fmCrosspostUserId,
  });

  // If we're creating a new post without making a draft first then we won't have an ID yet
  if (!post._id) {
    post._id = randomId();
  }

  const apiUrl = makeApiUrl(apiRoutes.crosspost);
  const result = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      postId: post._id,
      postTitle: post.title,
    }),
  });
  const json = await result.json();
  if (json.status !== "posted" || !json.postId) {
    throw new Error(`Failed to create crosspost: ${JSON.stringify(json)}`);
  }

  post.fmCrosspost.foreignPostId = json.postId;
  return post;
}

export const handleCrosspostUpdate = async (document: DbPost, data: Partial<DbPost>) => {
  if (data.draft !== undefined || data.deletedDraft !== undefined) {
    await updateCrosspostDraftStatus({
      ...document,
      draft: data.draft ?? document.draft,
      deletedDraft: data.deletedDraft ?? document.deletedDraft,
    });
  }

  return performCrosspost({
    _id: document._id,
    title: document.title,
    userId: document.userId,
    draft: document.draft,
    fmCrosspost: document.fmCrosspost,
    ...data,
  });
}
