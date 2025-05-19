import Users from "../../server/collections/users/collection";
import { randomId } from "../../lib/random";
import { UpdateCallbackProperties } from "../mutationCallbacks";
import { extractDenormalizedData } from "./denormalizedFields";
import type { Crosspost, DenormalizedCrosspostData } from "./types";
import {
  createCrosspostToken,
  updateCrosspostToken,
} from "@/server/crossposting/tokens";
import {
  createCrosspostRoute,
  updateCrosspostRoute,
} from "@/lib/fmCrosspost/routes";
import { makeV2CrossSiteRequest } from "@/server/crossposting/crossSiteRequest";
import { getLatestContentsRevision } from '../collections/revisions/helpers';
import schema from "@/lib/collections/posts/newSchema";
import Revisions from '../collections/revisions/collection';

const assertPostIsCrosspostable = (post: {
  isEvent?: boolean | null,
  shortform?: boolean | null,
}) => {
  if (post.isEvent) {
    throw new Error("Events cannot be crossposted");
  }
  if (post.shortform) {
    throw new Error("Quick takes cannot be crossposted");
  }
}

const performCrosspost = async (
  context: ResolverContext,
  data: UpdatePostDataInput,
  newPost: DbPost,
): Promise<CrosspostInput | null> => {
  const post = {...newPost, ...data}

  // TODO: validate userId owns foreignPost && currentUser === userId || currentUser.isAdmin
  if (!post.fmCrosspost || !post.userId || post.draft) {
    return post.fmCrosspost;
  }

  const {isCrosspost, hostedHere, foreignPostId} = post.fmCrosspost;
  if (!isCrosspost || !hostedHere || foreignPostId) {
    return post.fmCrosspost;
  }

  assertPostIsCrosspostable(post);

  const user = await Users.findOne({_id: post.userId});
  if (!user || !user.fmCrosspostUserId) {
    throw new Error("You have not connected a crossposting account yet");
  }

  // If we're creating a new post without making a draft first then we won't have an ID yet
  if (!('_id' in post)) {
    Object.assign(post, {_id: randomId()});
  }

  // Grab the normalized contents from the revision
  const contents = post.contents
    ? post.contents
    : await getLatestContentsRevision(
      post as { contents_latest: string | null },
      context,
    );
  if (!contents) {
    throw new Error("Couldn't find contents for crosspost");
  }

  const postWithDefaultValues = {
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
    contents: {
      originalContents: contents?.originalContents,
      draft: (contents as DbRevision)?.draft ?? post.draft ?? false,
    },
  });

  const {postId} = await makeV2CrossSiteRequest(
    createCrosspostRoute,
    {token},
    "Failed to create crosspost",
  );

  post.fmCrosspost.foreignPostId = postId;
  return post.fmCrosspost;
}

const updateCrosspost = async (
  foreignPostId: string,
  latestRevisionId: string | null,
  denormalizedData: DenormalizedCrosspostData,
) => {
  const revision = latestRevisionId
    ? await Revisions.findOne({_id: latestRevisionId})
    : null;
  const token = await updateCrosspostToken.create({
    ...denormalizedData,
    postId: foreignPostId,
    contents: {
      originalContents: revision?.originalContents,
      draft: revision?.draft ?? false,
    },
  });
  await makeV2CrossSiteRequest(
    updateCrosspostRoute,
    {token},
    "Failed to update crosspost",
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
  await updateCrosspost(post.fmCrosspost.foreignPostId, post.contents_latest, {
    ...extractDenormalizedData(post),
    draft: true,
  });
}

export const handleCrosspostUpdate = async (
  context: ResolverContext,
  data: UpdatePostDataInput,
  {oldDocument, newDocument, currentUser}: UpdateCallbackProperties<"Posts">
): Promise<UpdatePostDataInput> => {
  const {userId, fmCrosspost} = newDocument;
  const shouldRemoveCrosspost =
    (oldDocument.fmCrosspost && data.fmCrosspost === null) ||
    (oldDocument.fmCrosspost?.isCrosspost && data.fmCrosspost?.isCrosspost === false)
  if (shouldRemoveCrosspost) {
    await removeCrosspost(newDocument);
  }
  if (!fmCrosspost?.isCrosspost) {
    return data;
  }
  if (!fmCrosspost?.hostedHere) {
    return data;
  }

  if (fmCrosspost.foreignPostId) {
    assertPostIsCrosspostable(newDocument);

    const denormalizedData = extractDenormalizedData(newDocument);
    // Hack to deal with site admins moving posts to draft
    // Admins of non-local posts cannot cause source post to be set to draft
    if (
      denormalizedData.draft &&
      !oldDocument.draft &&
      !fmCrosspost.hostedHere &&
      currentUser?._id !== userId // Users can setting their own posts to draft affects both sites
    ) {
      denormalizedData.draft = oldDocument.draft;
      denormalizedData.deletedDraft = oldDocument.deletedDraft;
    }
    const latestRevisionId =
      (data as AnyBecauseHard).contents_latest ??
      newDocument.contents_latest ??
      oldDocument.contents_latest;
    await updateCrosspost(fmCrosspost.foreignPostId, latestRevisionId, denormalizedData);
    // TODO-HACK: Drafts are very bad news for crossposts, so we will unlink in
    // such cases. See sad message to users in ForeignCrosspostEditForm.tsx.
    if (newDocument.draft && !oldDocument.draft) {
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

  const fmCrosspostData = await performCrosspost(context, data, newDocument);
  return {
    ...data,
    fmCrosspost: fmCrosspostData,
  };
}
