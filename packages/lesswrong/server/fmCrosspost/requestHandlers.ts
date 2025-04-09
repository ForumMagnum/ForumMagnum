import type { Request } from "express";
import Posts from "../../server/collections/posts/collection";
import Users from "../../server/collections/users/collection";
import { getGraphQLSingleQueryFromOptions } from "../../lib/crud/withSingle";
import { createMutator } from "../vulcan-lib/mutators";
import { createAnonymousContext } from "../vulcan-lib/createContexts";
import { extractDenormalizedData } from "./denormalizedFields";
import { InvalidUserError, UnauthorizedError } from "./errors";
import { validateCrosspostingKarmaThreshold } from "./helpers";
import type { GetRouteOf, PostRouteOf } from "./routes";
import { verifyToken } from "./tokens";
import {
  ConnectCrossposterPayloadValidator,
  CrosspostPayloadValidator,
  UnlinkCrossposterPayloadValidator,
  UpdateCrosspostPayloadValidator,
} from "./types";
import { connectCrossposterToken } from "../crossposting/tokens";
import { collectionNameToTypeName } from "@/lib/generated/collectionTypeNames";
import { getSingleResolverName } from "@/lib/crud/utils";

export const onCrosspostTokenRequest: GetRouteOf<'crosspostToken'> = async (req: Request) => {
  const {user} = req;
  if (!user) {
    throw new UnauthorizedError();
  }

  // Throws an error if user doesn't have enough karma on the source forum (which is the current execution environment)
  validateCrosspostingKarmaThreshold(user);

  const token = await connectCrossposterToken.create({userId: user._id});
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

  /**
   * TODO: Null is made legal value for fields but database types are incorrectly generated without null. 
   * Hacky fix for now. Search 84b2 to find all instances of this casting.
   */
  const document: Partial<DbPost> = {
    userId: user._id,
    fmCrosspost: {
      isCrosspost: true,
      hostedHere: false,
      foreignPostId: postId,
    },
    ...denormalizedData,
  } as Partial<DbPost>;

  const {data: post} = await createMutator({
    document,
    collection: Posts,
    validate: false,
    currentUser: user,
    // This is a hack - we have only a fraction of the necessary information for
    // a context. But it appears to be working.
    context: {
      ...createAnonymousContext(),
      currentUser: user,
      isFMCrosspostRequest: true,
    },
  });

  return {
    status: "posted",
    postId: post._id,
  };
};

//TODO: clean up typecast `as Partial<DbPost>` below, Code: 84b2
export const onUpdateCrosspostRequest: PostRouteOf<'updateCrosspost'> = async (req) => {
  const { token } = req;
  const {postId, ...rest} = await verifyToken(token, UpdateCrosspostPayloadValidator.is);
  const denormalizedData: Partial<DbPost> = extractDenormalizedData(rest) as Partial<DbPost>;
  await Posts.rawUpdateOne({_id: postId}, {$set: denormalizedData});
  return { status: 'updated' };
};

export const onGetCrosspostRequest: PostRouteOf<'getCrosspost'> = async (req) => {
  const { createClient }: typeof import('../vulcan-lib/apollo-ssr/apolloClient') = require('../vulcan-lib/apollo-ssr/apolloClient');
  const { collectionName, extraVariables, extraVariablesValues, fragmentName, documentId } = req;
  const apolloClient = await createClient(createAnonymousContext());
  const typeName = collectionNameToTypeName[collectionName];
  const resolverName = getSingleResolverName(typeName);
  const query = getGraphQLSingleQueryFromOptions({
    extraVariables,
    collectionName,
    fragmentName,
    fragment: undefined,
    resolverName,
  });

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
