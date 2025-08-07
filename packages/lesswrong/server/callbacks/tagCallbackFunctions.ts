import { taggingNameSetting } from "@/lib/instanceSettings";
import { AfterCreateCallbackProperties, CreateCallbackProperties, UpdateCallbackProperties } from "../mutationCallbacks";
import { elasticSyncDocument } from "../search/elastic/elasticCallbacks";
import { userCanUseTags } from "@/lib/betas";
import { canVoteOnTagAsync } from "@/lib/voting/tagRelVoteRules";
import { updatePostDenormalizedTags } from "../tagging/helpers";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { createNotifications, getSubscribedUsers } from "../notificationCallbacksHelpers";
import { postIsPublic } from "@/lib/collections/posts/helpers";
import { subscriptionTypes } from "@/lib/collections/subscriptions/helpers";
import { updateTag } from "../collections/tags/mutations";
import difference from "lodash/difference";
import { backgroundTask } from "../utils/backgroundTask";

const utils = {
  isValidTagName: (name: string) => {
    if (!name || !name.length)
      return false;
    return true;
  },

  normalizeTagName: (name: string) => {
    // If the name starts with a hash, strip it off
    if (name.startsWith("#"))
      return name.substr(1);
    else
      return name;
  },
};

/* TAG CALLBACKS */

/* CREATE VALIDATE */
export async function validateTagCreate(tag: CreateTagDataInput, context: ResolverContext): Promise<boolean> {
  const { Tags } = context;

  if (!tag.name || !tag.name.length)
    throw new Error("Name is required");
  if (!utils.isValidTagName(tag.name))
    throw new Error(`Invalid ${taggingNameSetting.get()} name (use only letters, digits and dash)`);
  
  // If the name starts with a hash, strip it off
  const normalizedName = utils.normalizeTagName(tag.name);
  if (tag.name !== normalizedName) {
    tag = {
      ...tag,
      name: normalizedName,
    };
  }
  
  // Name must be unique
  const existing = await Tags.find({name: normalizedName, deleted:false}).fetch();
  if (existing.length > 0)
    throw new Error(`A ${taggingNameSetting.get()} by that name already exists`);

  return true;
}

/* UPDATE VALIDATE */
export async function validateTagUpdate(oldDocument: DbTag, newDocument: DbTag, context: ResolverContext): Promise<boolean> {
  const { Tags } = context;

  if (!utils.isValidTagName(newDocument.name))
    throw new Error(`Invalid ${taggingNameSetting.get()} name`);

  const newName = utils.normalizeTagName(newDocument.name);
  if (oldDocument.name !== newName) { // Tag renamed?
    const existing = await Tags.find({name: newName, deleted:false}).fetch();
    if (existing.length > 0)
      throw new Error(`A ${taggingNameSetting.get()} by that name already exists`);
  }
  
  if (newDocument.name !== newName) {
    newDocument = {
      ...newDocument, name: newName
    }
  }

  return true;
}

/* UPDATE AFTER */
export async function cascadeSoftDeleteToTagRels(newDoc: DbTag, { oldDocument, context }: UpdateCallbackProperties<'Tags'>): Promise<DbTag> {
  const { TagRels } = context;

  // If this is soft deleting a tag, then cascade to also soft delete any
  // tagRels that go with it.
  if (newDoc.deleted && !oldDocument.deleted) {
    await TagRels.rawUpdateMany({ tagId: newDoc._id }, { $set: { deleted: true } }, { multi: true });
  }
  return newDoc;
}

export async function updateParentTagSubTagIds(newDoc: DbTag, { oldDocument, context }: UpdateCallbackProperties<'Tags'>): Promise<DbTag> {
  const { Tags } = context;

  // If a parent tag has been added, add this tag to the subTagIds of the parent
  if (newDoc.parentTagId === oldDocument.parentTagId) return newDoc;

  // Remove this tag from the subTagIds of the old parent
  if (oldDocument.parentTagId) {
    const oldParent = await Tags.findOne(oldDocument.parentTagId);
    await updateTag({
      data: {subTagIds: [...(oldParent?.subTagIds || []).filter((id: string) => id !== newDoc._id)]},
      selector: { _id: oldDocument.parentTagId }
    }, context)
  }
  // Add this tag to the subTagIds of the new parent
  if (newDoc.parentTagId) {
    const newParent = await Tags.findOne(newDoc.parentTagId);
    await updateTag({
      data: {subTagIds: [...(newParent?.subTagIds || []), newDoc._id]},
      selector: { _id: newDoc.parentTagId }
    }, context)
  }
  return newDoc;
}

// Users who have this as a profile tag may need to be reexported to elastic
export async function reexportProfileTagUsersToElastic(newDocument: DbTag, { oldDocument, context }: UpdateCallbackProperties<'Tags'>): Promise<DbTag> {
  const { Users } = context;

  const wasDeletedChanged = !!newDocument.deleted !== !!oldDocument.deleted;
  const wasRenamed = newDocument.name !== oldDocument.name;
  const wasSlugChanged = newDocument.slug !== oldDocument.slug;
  if (wasDeletedChanged || wasRenamed || wasSlugChanged) {
    const users = await Users.find({
      profileTagIds: oldDocument._id,
    }, {
      projection: {_id: 1},
    }).fetch();
    for (const user of users) {
      backgroundTask(elasticSyncDocument("Users", user._id));
    }
  }
  return newDocument;
}


/* TAG REL CALLBACKS */

/* CREATE BEFORE */
export async function validateTagRelCreate(newDocument: Partial<DbInsertion<DbTagRel>>, { currentUser, context }: CreateCallbackProperties<'TagRels', Partial<DbInsertion<DbTagRel>>>) {
  const {tagId, postId} = newDocument;

  if (!userCanUseTags(currentUser) || !currentUser || !tagId || !postId) {
    throw new Error(`You do not have permission to add this ${taggingNameSetting.get()}`);
  }

  const canVoteOnTag = await canVoteOnTagAsync(currentUser, tagId, postId, context, (newDocument.baseScore ?? 0) >= 0 ? "smallUpvote" : "smallDownvote");
  if (canVoteOnTag.fail) {
    throw new Error(`You do not have permission to add this ${taggingNameSetting.get()}`);
  }
}

/* NEW AFTER */
export async function voteForTagWhenCreated(tagRel: DbTagRel, { context }: AfterCreateCallbackProperties<'TagRels'>): Promise<DbTagRel> {
  const { Users, TagRels } = context;

  // When you add a tag, vote for it as relevant
  var tagCreator = await Users.findOne(tagRel.userId);
  if (!tagCreator) throw new Error(`Could not find user ${tagRel.userId}`);
  const { performVoteServer } = require('../voteServer');
  const {modifiedDocument: votedTagRel} = await performVoteServer({
    document: tagRel,
    voteType: 'smallUpvote',
    collection: TagRels,
    user: tagCreator,
    skipRateLimits: true,
    selfVote: true
  })
  await updatePostDenormalizedTags(tagRel.postId);
  return {...tagRel, ...votedTagRel} as DbTagRel;
}

/* NEW ASYNC */
export async function taggedPostNewNotifications(tagRel: DbTagRel, { context }: AfterCreateCallbackProperties<'TagRels'>): Promise<void> {
  const { Posts } = context;

  const subscribedUsers = await getSubscribedUsers({
    documentId: tagRel.tagId,
    collectionName: "Tags",
    type: subscriptionTypes.newTagPosts
  })
  const post = await Posts.findOne({_id:tagRel.postId})
  if (post && postIsPublic(post) && !post.authorIsUnreviewed) {
    const subscribedUserIds = subscribedUsers.map(u=>u._id);
    
    // Don't notify the person who created the tagRel
    let tagSubscriberIdsToNotify = difference(subscribedUserIds, filterNonnull([tagRel.userId]))

    //eslint-disable-next-line no-console
    console.info("Post tagged, creating notifications");
    await createNotifications({userIds: tagSubscriberIdsToNotify, notificationType: 'newTagPosts', documentType: 'tagRel', documentId: tagRel._id});
  }
}
