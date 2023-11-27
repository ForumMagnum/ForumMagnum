import pick from 'lodash/pick'
import Users from "../../lib/collections/users/collection";
import { randomId } from "../../lib/random";
import { loggerConstructor } from "../../lib/utils/logging";
import { UpdateCallbackProperties } from "../mutationCallbacks";
import { denormalizedFieldKeys, extractDenormalizedData } from "./denormalizedFields";
import { makeCrossSiteRequest } from "./resolvers";
import { signToken } from "./tokens";
import type { Crosspost, CrosspostPayload, UpdateCrosspostPayload } from "./types";
import { DenormalizedCrosspostData } from "./types";

export async function performCrosspost<T extends Crosspost>(post: T): Promise<T> {
  const logger = loggerConstructor('callbacks-posts')
  logger('performCrosspost()')
  logger('post info:', pick(post, ['title', 'fmCrosspost']))
  // TODO: validate userId owns foreignPost && currentUser === userId || currentUser.isAdmin
  if (!post.fmCrosspost || !post.userId || post.draft) {
    logger('post is not a crosspost or is a draft, returning')
    return post;
  }

  const {isCrosspost, hostedHere, foreignPostId} = post.fmCrosspost;
  if (!isCrosspost || !hostedHere || foreignPostId) {
    logger ('post is not a crosspost, or is a foreign-hosted crosspost, or has already been crossposted, returning')
    return post;
  }

  if (post.isEvent) {
    logger ('post is an event, throwing')
    throw new Error("Events cannot be crossposted");
  }

  const user = await Users.findOne({_id: post.userId});
  if (!user || !user.fmCrosspostUserId) {
    logger('user has not connected an account, throwing')
    throw new Error("You have not connected a crossposting account yet");
  }

  // If we're creating a new post without making a draft first then we won't have an ID yet
  if (!post._id) {
    logger('we must be creating a new post, assigning a random ID')
    post._id = randomId();
  }

  const token = await signToken<CrosspostPayload>({
    localUserId: post.userId,
    foreignUserId: user.fmCrosspostUserId,
    postId: post._id,
    ...extractDenormalizedData(post),
  });

  const { postId } = await makeCrossSiteRequest(
    'crosspost',
    { token },
    'Failed to create crosspost'
  );

  logger('crosspost successful, setting foreignPostId:', postId)
  post.fmCrosspost.foreignPostId = postId;
  return post;
}

const updateCrosspost = async (postId: string, denormalizedData: DenormalizedCrosspostData) => {
  const token = await signToken<UpdateCrosspostPayload>({
    ...denormalizedData,
    postId,
  });
  await makeCrossSiteRequest(
    'updateCrosspost',
    { token },
    "Failed to update crosspost draft status",
  );
}
/**
 * TODO-HACK: We will kick the can down the road on actually removing the
 * crosspost data from the foreign server -- set it as a draft.
 */
const removeCrosspost = async <T extends Crosspost>(post: T) => {
  if (!post.fmCrosspost || !post.fmCrosspost.foreignPostId) {
    // eslint-disable-next-line no-console
    console.warn("Cannot remove crosspost that doesn't exist");
    return;
  }
  await updateCrosspost(post.fmCrosspost.foreignPostId, {
    ...extractDenormalizedData(post),
    draft: true,
  });
}

export async function handleCrosspostUpdate(
  data: Partial<DbPost>,
  {oldDocument, newDocument, currentUser}: UpdateCallbackProperties<DbPost>
): Promise<Partial<DbPost>> {
  const logger = loggerConstructor('callbacks-posts')
  logger('handleCrosspostUpdate()')
  const {_id, userId, fmCrosspost } = newDocument;
  const shouldRemoveCrosspost =
    (oldDocument.fmCrosspost && data.fmCrosspost === null) ||
    (oldDocument.fmCrosspost?.isCrosspost && data.fmCrosspost?.isCrosspost === false)
  if (shouldRemoveCrosspost) {
    logger('crosspost should be removed, removing')
    await removeCrosspost(newDocument);
  }
  if (!fmCrosspost) {
    logger('post is not a crosspost, returning')
    return data;
  }
  if (
    denormalizedFieldKeys.some(
      (key) => data[key] !== undefined && data[key] !== oldDocument[key]
    ) &&
    fmCrosspost.foreignPostId
  ) {
    if (newDocument.isEvent) {
      logger('post is an event, throwing')
      throw new Error("Events cannot be crossposted");
    }
    
    logger('denormalized fields changed, updating crosspost')
    const denormalizedData = extractDenormalizedData(newDocument);
    // Hack to deal with site admins moving posts to draft
    // Admins of non-local posts cannot cause source post to be set to draft
    if (
      denormalizedData.draft &&
      !oldDocument.draft &&
      !fmCrosspost.hostedHere &&
      currentUser?._id !== userId // Users can setting their own posts to draft affects both sites
    ) {
      logger('needed to use the terrible hack, not updating foreign post draft status')
      denormalizedData.draft = oldDocument.draft;
      denormalizedData.deletedDraft = oldDocument.deletedDraft;
    }
    logger('denormalizedData:', denormalizedData)
    await updateCrosspost(fmCrosspost.foreignPostId, denormalizedData);
    logger('crosspost updated successfully')
    // TODO-HACK: Drafts are very bad news for crossposts, so we will unlink in
    // such cases. See sad message to users in ForeignCrosspostEditForm.tsx.
    if (newDocument.draft && !oldDocument.draft) {
      logger('hack: post is now a draft, unlinking crosspost')
      return {
        ...newDocument,
        fmCrosspost: {
          ...fmCrosspost,
          foreignPostId: null,
        },
      }
    }
    return data;
  }

  /**
   * TODO: Null is made legal value for fields but database types are incorrectly generated without null. 
   * Hacky fix for now. Search 84b2 to find all instances of this casting.
   */
  return performCrosspost({
    _id,
    userId,
    fmCrosspost,
    ...extractDenormalizedData(newDocument),
    ...data,
  }) as Partial<DbPost>; 
}
