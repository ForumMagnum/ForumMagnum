import { DatabaseServerSetting } from "./databaseSettings";
import { Utils, addGraphQLMutation, addGraphQLResolvers } from "../lib/vulcan-lib";
import { fmCrosspostBaseUrlSetting } from "../lib/instanceSettings";
import { randomId } from "../lib/random";
import Users from "../lib/collections/users/collection";
import Posts from "../lib/collections/posts/collection";
import fetch from "node-fetch";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { json } from "body-parser";
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
  updateCrosspost: "/api/updateCrosspost",
} as const;

type ApiRoute = typeof apiRoutes[keyof typeof apiRoutes];

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

class InvalidUserError extends ApiError {
  constructor() {
    super(400, "Invalid user");
  }
}

type ConnectCrossposterArgs = {
  token: string,
}

type ConnectCrossposterPayload = {
  userId: string,
}

const validateConnectCrossposterPayload = (payload: ConnectCrossposterPayload) => {
  if (!payload.userId || typeof payload.userId !== "string") {
    throw new MissingParametersError(["userId"], payload);
  }
}

type UnlinkCrossposterPayload = {
  userId: string,
}

const validateUnlinkCrossposterPayload = (payload: UnlinkCrossposterPayload) => {
  if (!payload.userId || typeof payload.userId !== "string") {
    throw new MissingParametersError(["userId"], payload);
  }
}

type UpdateCrosspostPayload = {
  postId: string,
  draft: boolean,
  deletedDraft: boolean,
  title: string,
}

const validateUpdateCrosspostPayload = (payload: UpdateCrosspostPayload) => {
  if (
    !payload.postId || typeof payload.postId !== "string" ||
    typeof payload.draft !== "boolean" ||
    typeof payload.deletedDraft !== "boolean" ||
    !payload.title || typeof payload.title !== "string"
  ) {
    throw new MissingParametersError(["postId", "draft", "draftDeleted", "title"], payload);
  }
}

type CrosspostPayload = {
  localUserId: string,
  foreignUserId: string,
}

const validateCrosspostPayload = (payload: CrosspostPayload) => {
  if (
    !payload.localUserId || typeof payload.localUserId !== "string" ||
    !payload.foreignUserId || typeof payload.foreignUserId !== "string"
  ) {
    throw new MissingParametersError(["localUserId", "foreignUserId"], payload);
  }
}

type Crosspost = Pick<DbPost, "_id" | "title" | "userId" | "fmCrosspost" | "draft">;

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

const signToken = <T extends {}>(payload: T): Promise<string> =>
  new Promise((resolve, reject) => {
    jwt.sign(payload, getSecret(), jwtSigningOptions, (err, token) => {
      if (token) {
        resolve(token);
      } else {
        reject(err);
      }
    });
  });

const verifyToken = <T extends {}>(token: string, validator: (payload: T) => void): Promise<T> =>
  new Promise((resolve, reject) => {
    jwt.verify(token, getSecret(), (err: VerifyErrors | null, decoded?: T) => {
      const payload = decoded as T;
      if (payload) {
        try {
          validator(payload);
        } catch (e) {
          reject(e);
        }
        resolve(payload);
      } else {
        reject(err);
      }
    });
  });

const crosspostResolvers = {
  Mutation: {
    connectCrossposter: async (
      _root: void,
      {token}: ConnectCrossposterArgs,
      {req}: ResolverContext,
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
    unlinkCrossposter: async (_root: void, _args: {}, {req}: ResolverContext) => {
      const localUserId = getUserId(req);
      const foreignUserId = req?.user?.fmCrosspostUserId;
      if (foreignUserId) {
        const token = await signToken<UnlinkCrossposterPayload>({userId: foreignUserId});
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

const updateCrosspost = async (post: DbPost) => {
  if (post.fmCrosspost?.foreignPostId) {
    const token = await signToken<UpdateCrosspostPayload>({
      postId: post.fmCrosspost.foreignPostId,
      draft: post.draft,
      deletedDraft: post.deletedDraft,
      title: post.title,
    });
    await makeCrossSiteRequest(
      apiRoutes.updateCrosspost,
      {token},
      "updated",
      "Failed to update crosspost draft status",
    );
  }
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

  const token = await signToken<ConnectCrossposterPayload>({userId: user._id});
  res.send({token});
});

const onConnectCrossposterRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token, localUserId] = getPostParams(req, ["token", "localUserId"]);
  const payload = await verifyToken<ConnectCrossposterPayload>(token, validateConnectCrossposterPayload);
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
  const payload = await verifyToken<UnlinkCrossposterPayload>(token, validateUnlinkCrossposterPayload);
  const {userId} = payload;
  await Users.rawUpdateOne({_id: userId}, {
    $unset: {fmCrosspostUserId: ""},
  });
  res.send({status: "unlinked"});
});

const onCrosspostRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token, postId, postTitle] = getPostParams(req, ["token", "postId", "postTitle"]);
  const payload = await verifyToken<CrosspostPayload>(token, validateCrosspostPayload);
  const {localUserId, foreignUserId} = payload;

  const user = await Users.findOne({_id: foreignUserId});
  if (!user || user.fmCrosspostUserId !== localUserId) {
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

const onUpdateCrosspostRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token] = getPostParams(req, ["token"]);
  const payload = await verifyToken<UpdateCrosspostPayload>(token, validateUpdateCrosspostPayload);
  const {postId, draft, deletedDraft, title} = payload;
  await Posts.rawUpdateOne({_id: postId}, {$set: {draft, deletedDraft, title}});
  res.send({status: "updated"});
});

export const addCrosspostRoutes = (app: Application) => {
  const addPostRoute = (route: string, callback: (req: Request, res: Response) => Promise<void>) => {
    app.use(route, json({ limit: "1mb" }));
    app.post(route, callback);
  }
  app.get(apiRoutes.crosspostToken, onCrosspostTokenRequest);
  addPostRoute(apiRoutes.connectCrossposter, onConnectCrossposterRequest);
  addPostRoute(apiRoutes.unlinkCrossposter, onUnlinkCrossposterRequest);
  addPostRoute(apiRoutes.crosspost, onCrosspostRequest);
  addPostRoute(apiRoutes.updateCrosspost, onUpdateCrosspostRequest);
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

  const token = await signToken<CrosspostPayload>({
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
  if (data.draft !== undefined || data.deletedDraft !== undefined || data.title !== undefined) {
    await updateCrosspost({
      ...document,
      draft: data.draft ?? document.draft,
      deletedDraft: data.deletedDraft ?? document.deletedDraft,
      title: data.title ?? document.title,
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
