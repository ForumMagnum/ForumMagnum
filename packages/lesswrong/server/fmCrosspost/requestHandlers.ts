import type { Request, Response } from "express";
import { Utils } from "../../lib/vulcan-lib";
import Users from "../../lib/collections/users/collection";
import Posts from "../../lib/collections/posts/collection";
import {
  ApiError,
  UnauthorizedError,
  MissingParametersError,
  InvalidUserError,
} from "./errors";
import {
  ConnectCrossposterPayload,
  validateConnectCrossposterPayload,
  validateUnlinkCrossposterPayload,
  validateUpdateCrosspostPayload,
  validateCrosspostPayload,
} from "./types";
import { signToken, verifyToken } from "./tokens";

const withApiErrorHandlers = (callback: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response) => {
    try {
      await callback(req, res);
    } catch (e) {
      res
        .status(e instanceof ApiError ? e.code : 501)
        .send({error: e.message ?? "An unknown error occurred"})
    }
  }

const getPostParams = (req: Request, paramNames: string[]): string[] => {
  const params = paramNames.map((name) => req.body[name]);
  if (params.some((param) => !param)) {
    throw new MissingParametersError(paramNames, req.body);
  }
  return params;
}

export const onCrosspostTokenRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const {user} = req;
  if (!user) {
    throw new UnauthorizedError();
  }

  const token = await signToken<ConnectCrossposterPayload>({userId: user._id});
  res.send({token});
});

export const onConnectCrossposterRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token, localUserId] = getPostParams(req, ["token", "localUserId"]);
  const payload = await verifyToken(token, validateConnectCrossposterPayload);
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

export const onUnlinkCrossposterRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token] = getPostParams(req, ["token"]);
  const payload = await verifyToken(token, validateUnlinkCrossposterPayload);
  const {userId} = payload;
  await Users.rawUpdateOne({_id: userId}, {
    $unset: {fmCrosspostUserId: ""},
  });
  res.send({status: "unlinked"});
});

export const onCrosspostRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token, postId, postTitle] = getPostParams(req, ["token", "postId", "postTitle"]);
  const payload = await verifyToken(token, validateCrosspostPayload);
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
    validate: false,
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

export const onUpdateCrosspostRequest = withApiErrorHandlers(async (req: Request, res: Response) => {
  const [token] = getPostParams(req, ["token"]);
  const payload = await verifyToken(token, validateUpdateCrosspostPayload);
  const {postId, draft, deletedDraft, title} = payload;
  await Posts.rawUpdateOne({_id: postId}, {$set: {draft, deletedDraft, title}});
  res.send({status: "updated"});
});
