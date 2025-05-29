import pick from 'lodash/pick'
import Users from "../../server/collections/users/collection";
import { randomId } from "../../lib/random";
import { loggerConstructor } from "../../lib/utils/logging";
import { denormalizedFieldKeys, extractDenormalizedData } from "./denormalizedFields";
import { makeCrossSiteRequest } from "./resolvers";
import type { UpdateCallbackProperties } from "../mutationCallbacks";
import { requiredDenormalizedFields, type Crosspost, type DenormalizedCrosspostData } from "./types";
import {
  createCrosspostToken,
  updateCrosspostToken,
} from "@/server/crossposting/tokens";
import schema from "@/lib/collections/posts/newSchema";
// import { getLatestContentsRevision } from '@/lib/collections/revisions/helpers';
// import { fetchFragmentSingle } from '../fetchFragment';
// import {
//   createCrosspostRoute,
//   updateCrosspostRoute,
// } from "@/lib/fmCrosspost/routes";
// import { makeV2CrossSiteRequest } from "@/server/crossposting/crossSiteRequest";

const assertPostIsCrosspostable = (
  post: CreatePostDataInput | UpdatePostDataInput | Partial<DbPost>,
  logger: ReturnType<typeof loggerConstructor>,
) => {
  if (post.isEvent) {
    logger('post is an event, throwing')
    throw new Error("Events cannot be crossposted");
  }
  if (post.shortform) {
    loggerConstructor('post is a shortform, throwing')
    throw new Error("Quick takes cannot be crossposted");
  }
}

export async function performCrosspost<T extends Pick<CreatePostDataInput | UpdatePostDataInput, 'fmCrosspost' | 'userId' | 'draft' | 'title' | 'isEvent' | 'question'>>(post: T): Promise<T> {
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

  assertPostIsCrosspostable(post, logger);

  const user = await Users.findOne({_id: post.userId});
  if (!user || !user.fmCrosspostUserId) {
    logger('user has not connected an account, throwing')
    throw new Error("You have not connected a crossposting account yet");
  }

  // If we're creating a new post without making a draft first then we won't have an ID yet
  if (!('_id' in post)) {
    logger('we must be creating a new post, assigning a random ID')
    Object.assign(post, {_id: randomId()});
  }

  // Grab the normalized contents from the revision
  // TODO: Enable to this when V2 is deployed to both sites
  // const revision = await getLatestContentsRevision(post);

  const postWithDefaultValues: T & DenormalizedCrosspostData = {
    ...post,
    draft: post.draft ?? schema.draft.database.defaultValue,
    deletedDraft: (post as UpdatePostDataInput).deletedDraft ?? schema.deletedDraft.database.defaultValue,
    title: post.title ?? '',
    isEvent: post.isEvent ?? schema.isEvent.database.defaultValue,
    question: post.question ?? schema.question.database.defaultValue,
  };

  const token = await createCrosspostToken.create({
    localUserId: post.userId,
    foreignUserId: user.fmCrosspostUserId,
    postId: (post as unknown as DbPost)._id,
    ...extractDenormalizedData(postWithDefaultValues),
    // TODO: Enable to this when V2 is deployed to both sites
    // originalContents: revision?.originalContents,
  });

  const { postId } = await makeCrossSiteRequest(
    'crosspost',
    { token },
    'Failed to create crosspost'
  );
  // TODO: Switch to this when V2 is deployed to both sites
  // const {postId} = await makeV2CrossSiteRequest(
  //   createCrosspostRoute,
  //   {token},
  //   "Failed to create crosspost",
  // );

  logger('crosspost successful, setting foreignPostId:', postId)
  post.fmCrosspost.foreignPostId = postId;
  return post;
}

const updateCrosspost = async (postId: string, denormalizedData: DenormalizedCrosspostData) => {
  // TODO: Enable to this when V2 is deployed to both sites
  // const postOriginalContents = await fetchFragmentSingle({
  //   collectionName: "Posts",
  //   fragmentName: "PostsOriginalContents",
  //   currentUser: null,
  //   selector: postId,
  //   skipFiltering: true,
  // })

  const token = await updateCrosspostToken.create({
    ...denormalizedData,
    postId,
    // TODO: Enable to this when V2 is deployed to both sites
    // originalContents: postOriginalContents?.contents?.originalContents,
  });
  await makeCrossSiteRequest(
    'updateCrosspost',
    { token },
    "Failed to update crosspost draft status",
  );
  // TODO: Switch to this when V2 is deployed to both sites
  // await makeV2CrossSiteRequest(
  //   updateCrosspostRoute,
  //   {token},
  //   "Failed to update crosspost",
  // );
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
  data: UpdatePostDataInput,
  {oldDocument, newDocument, currentUser}: UpdateCallbackProperties<"Posts">
): Promise<UpdatePostDataInput> {
  const logger = loggerConstructor('callbacks-posts')
  logger('handleCrosspostUpdate()')
  const {userId, fmCrosspost} = newDocument;
  const shouldRemoveCrosspost =
    (oldDocument.fmCrosspost && data.fmCrosspost === null) ||
    (oldDocument.fmCrosspost?.isCrosspost && data.fmCrosspost?.isCrosspost === false)
  if (shouldRemoveCrosspost) {
    logger('crosspost should be removed, removing')
    await removeCrosspost(newDocument);
  }
  if (!fmCrosspost?.isCrosspost) {
    logger('post is not a crosspost, returning')
    return data;
  }
  if (
    denormalizedFieldKeys.some(
      (key) => data[key] !== undefined && data[key] !== oldDocument[key]
    ) &&
    fmCrosspost.foreignPostId
  ) {
    assertPostIsCrosspostable(newDocument, logger);

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
        ...data,
        fmCrosspost: {
          ...fmCrosspost,
          foreignPostId: null,
        },
      }
    }
    return data;
  }

  const crosspostedPost = await performCrosspost({ ...newDocument, ...data });
  return {
    ...data,
    fmCrosspost: crosspostedPost.fmCrosspost,
  };
}
