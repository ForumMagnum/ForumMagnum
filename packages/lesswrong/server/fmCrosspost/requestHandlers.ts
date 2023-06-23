import type { Request } from "express";
import Posts from "../../lib/collections/posts/collection";
import Users from "../../lib/collections/users/collection";
import { getGraphQLQueryFromOptions, getResolverNameFromOptions } from "../../lib/crud/withSingle";
import { getCollection, Utils } from "../../lib/vulcan-lib";
import { createClient } from "../vulcan-lib/apollo-ssr/apolloClient";
import { createAnonymousContext } from "../vulcan-lib/query";
import { extractDenormalizedData } from "./denormalizedFields";
import { InvalidUserError, UnauthorizedError } from "./errors";
import { validateCrosspostingKarmaThreshold } from "./helpers";
import type { GetRouteOf, PostRouteOf } from "./routes";
import { signToken, verifyToken } from "./tokens";
import {
  ConnectCrossposterPayload, ConnectCrossposterPayloadValidator, CrosspostPayloadValidator, UnlinkCrossposterPayloadValidator, UpdateCrosspostPayloadValidator
} from "./types";

export const onCrosspostTokenRequest: GetRouteOf<'crosspostToken'> = async (req: Request) => {
  const {user} = req;
  if (!user) {
    throw new UnauthorizedError();
  }

  // Throws an error if user doesn't have enough karma on the source forum (which is the current execution environment)
  validateCrosspostingKarmaThreshold(user);

  const token = await signToken<ConnectCrossposterPayload>({ userId: user._id });
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
    // This is a hack - we have only a fraction of the necessary information for
    // a context. But it appears to be working.
    context: {
      currentUser: user,
      isFMCrosspostRequest: true,
      Users,
    } as Partial<ResolverContext> as  ResolverContext,
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
  const { collectionName, extraVariables, extraVariablesValues, fragmentName, documentId } = req;
  const apolloClient = await createClient(createAnonymousContext());
  const collection = getCollection(collectionName);
  const query = getGraphQLQueryFromOptions({
    extraVariables,
    collection,
    fragmentName,
    fragment: undefined,
  });
  const resolverName = getResolverNameFromOptions(collection);

  const { data } = await apolloClient.query({
    query,
    variables: {
      input: {
        selector: { documentId }
      },
      ...extraVariablesValues
    },
  });

  const document = data?.[resolverName]?.result;

  return { document };
};
