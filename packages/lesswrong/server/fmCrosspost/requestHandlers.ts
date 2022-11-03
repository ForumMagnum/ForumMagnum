import type { Request, Response } from "express";
import Posts from "../../lib/collections/posts/collection";
import Users from "../../lib/collections/users/collection";
import { getGraphQLQueryFromOptions, getResolverNameFromOptions } from "../../lib/crud/withSingle";
import { getCollection, Utils } from "../../lib/vulcan-lib";
import { createAnonymousContext, createClient } from "../vulcan-lib";
import { extractDenormalizedData } from "./denormalizedFields";
import {
  ApiError, InvalidUserError, MissingParametersError, UnauthorizedError
} from "./errors";
import { PostRouteOf } from "./routes";
import { signToken, verifyToken } from "./tokens";
import {
  ConnectCrossposterPayload, ConnectCrossposterPayloadValidator, CrosspostPayloadValidator, UnlinkCrossposterPayloadValidator, UpdateCrosspostPayloadValidator
} from "./types";

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

export const onCrosspostTokenRequest = async (req: Request) => {
  const {user} = req;
  if (!user) {
    throw new UnauthorizedError();
  }

  const token = await signToken<ConnectCrossposterPayload>({userId: user._id});
  return {token};
};

export const onConnectCrossposterRequest: PostRouteOf<'connectCrossposter'> = async (req) => {
  const { token, localUserId } = req;
  const payload = await verifyToken(token, ConnectCrossposterPayloadValidator.is);
  const {userId: foreignUserId} = payload;
  await Users.rawUpdateOne({_id: foreignUserId}, {
    $set: {fmCrosspostUserId: localUserId},
  });
  return {
    status: "connected",
    foreignUserId,
    localUserId,
  };
};

export const onUnlinkCrossposterRequest: PostRouteOf<'unlinkCrossposter'> = async (req) => {
  const { token } = req;
  const payload = await verifyToken(token, UnlinkCrossposterPayloadValidator.is);
  const {userId} = payload;
  await Users.rawUpdateOne({_id: userId}, {
    $unset: {fmCrosspostUserId: ""},
  });
  return { status: 'unlinked' };
};

export const onCrosspostRequest: PostRouteOf<'crosspost'> = async (req) => {
  const { token } = req;
  const payload = await verifyToken(token, CrosspostPayloadValidator.is);
  const {localUserId, foreignUserId, postId, ...rest} = payload;
  const denormalizedData = extractDenormalizedData(rest);

  const user = await Users.findOne({_id: foreignUserId});
  if (!user || user.fmCrosspostUserId !== localUserId) {
    throw new InvalidUserError();
  }

  const document: Partial<DbPost> = {
    userId: user._id,
    fmCrosspost: {
      isCrosspost: true,
      hostedHere: false,
      foreignPostId: postId,
    },
    ...denormalizedData,
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

  return {
    status: "posted",
    postId: post._id,
  };
};

export const onUpdateCrosspostRequest: PostRouteOf<'updateCrosspost'> = async (req) => {
  const { token } = req;
  const {postId, ...rest} = await verifyToken(token, UpdateCrosspostPayloadValidator.is);
  const denormalizedData: Partial<DbPost> = extractDenormalizedData(rest);
  await Posts.rawUpdateOne({_id: postId}, {$set: denormalizedData});
  return { status: 'updated' };
};

export const onGetCrosspostRequest: PostRouteOf<'getCrosspost'> = async (req) => {
  const { collectionName, extraVariables, extraVariableValues, fragmentName, documentId } = req;
  const apolloClient = await createClient(createAnonymousContext());
  const collection = getCollection(collectionName);
  const query = getGraphQLQueryFromOptions({
    extraVariables,
    collection,
    fragmentName,
    fragment: undefined,
    extraQueries: undefined,
  });
  const resolverName = getResolverNameFromOptions(collection);

  const { data } = await apolloClient.query({
    query,
    variables: {
      input: {
        selector: { documentId }
      },
      ...extraVariableValues
    },
  });

  const document = data?.[resolverName]?.result;

  return { document };
};
