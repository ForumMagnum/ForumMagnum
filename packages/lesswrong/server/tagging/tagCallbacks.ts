import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Posts } from '../../lib/collections/posts/collection';
import Users from '../../lib/collections/users/collection';
import { voteCallbacks } from '../../lib/voting/vote';
import { performVoteServer } from '../voteServer';
import { getCollectionHooks } from '../mutationCallbacks';
import { updateDenormalizedContributorsList } from '../resolvers/tagResolvers';
import { isEAForum, taggingNameSetting } from '../../lib/instanceSettings';
import { updateMutator } from '../vulcan-lib';
import { ElectionCandidatesRepo } from '../repos';
import {
  donationElectionTagId,
  eaGivingSeason23ElectionName,
} from '../../lib/eaGivingSeason';

function isValidTagName(name: string) {
  if (!name || !name.length)
    return false;
  return true;
}

function normalizeTagName(name: string) {
  // If the name starts with a hash, strip it off
  if (name.startsWith("#"))
    return name.substr(1);
  else
    return name;
}

const updateDonationElectionPostCounts = async (
  tagRelDict: Record<string, number>,
) => {
  if (isEAForum && (tagRelDict[donationElectionTagId] ?? 0) >= 1) {
    await new ElectionCandidatesRepo().updatePostCounts(
      eaGivingSeason23ElectionName,
      donationElectionTagId,
    );
  }
}

export async function updatePostDenormalizedTags(postId: string) {
  if (!postId) {
    // eslint-disable-next-line no-console
    console.warn("Warning: Trying to update tagRelevance with an invalid post ID:", postId);
    return;
  }

  const tagRels: Array<DbTagRel> = await TagRels.find({postId, deleted: false}).fetch();
  const tagRelDict: Record<string, number> = {};

  for (let tagRel of tagRels) {
    if (tagRel.baseScore > 0)
      tagRelDict[tagRel.tagId] = tagRel.baseScore;
  }

  await Posts.rawUpdateOne({_id:postId}, {$set: {tagRelevance: tagRelDict}});

  void updateDonationElectionPostCounts(tagRelDict);
}

getCollectionHooks("Tags").createValidate.add(async (validationErrors: Array<any>, {document: tag}: {document: DbTag}) => {
  if (!tag.name || !tag.name.length)
    throw new Error("Name is required");
  if (!isValidTagName(tag.name))
    throw new Error(`Invalid ${taggingNameSetting.get()} name (use only letters, digits and dash)`);
  
  // If the name starts with a hash, strip it off
  const normalizedName = normalizeTagName(tag.name);
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
  
  return validationErrors;
});

getCollectionHooks("Tags").updateValidate.add(async (validationErrors: Array<any>, {oldDocument, newDocument}: {oldDocument: DbTag, newDocument: DbTag}) => {
  if (!isValidTagName(newDocument.name))
    throw new Error(`Invalid ${taggingNameSetting.get()} name`);

  const newName = normalizeTagName(newDocument.name);
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
  
  return validationErrors;
});

getCollectionHooks("Tags").updateAfter.add(async (newDoc: DbTag, {oldDocument}: {oldDocument: DbTag}) => {
  // If this is soft deleting a tag, then cascade to also soft delete any
  // tagRels that go with it.
  if (newDoc.deleted && !oldDocument.deleted) {
    await TagRels.rawUpdateMany({ tagId: newDoc._id }, { $set: { deleted: true } }, { multi: true });
  }
  return newDoc;
});

getCollectionHooks("Tags").updateAfter.add(async (newDoc: DbTag, {oldDocument}: {oldDocument: DbTag}) => {
  // If a parent tag has been added, add this tag to the subTagIds of the parent
  if (newDoc.parentTagId === oldDocument.parentTagId) return newDoc;

  // Remove this tag from the subTagIds of the old parent
  if (oldDocument.parentTagId) {
    const oldParent = await Tags.findOne(oldDocument.parentTagId);
    await updateMutator({
      collection: Tags,
      documentId: oldDocument.parentTagId,
      // TODO change to $pull (reverse of $addToSet) once it is implemented in postgres
      set: {subTagIds: [...(oldParent?.subTagIds || []).filter((id: string) => id !== newDoc._id)]},
      validate: false,
    })
  }
  // Add this tag to the subTagIds of the new parent
  if (newDoc.parentTagId) {
    const newParent = await Tags.findOne(newDoc.parentTagId);
    await updateMutator({
      collection: Tags,
      documentId: newDoc.parentTagId,
      // TODO change to $addToSet once it is implemented in postgres
      set: {subTagIds: [...(newParent?.subTagIds || []), newDoc._id]},
      validate: false,
    })
  }
  return newDoc;
});

getCollectionHooks("TagRels").newAfter.add(async (tagRel: DbTagRel) => {
  // When you add a tag, vote for it as relevant
  var tagCreator = await Users.findOne(tagRel.userId);
  if (!tagCreator) throw new Error(`Could not find user ${tagRel.userId}`);
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
});

function voteUpdatePostDenormalizedTags({newDocument}: {newDocument: VoteableType}) {
  let postId: string;
  if ("postId" in newDocument) { // is a tagRel
    // Applying human knowledge here
    postId = (newDocument as DbTagRel)["postId"];
  } else if ("tagRelevance" in newDocument) { // is a post
    postId = newDocument["_id"];
  } else {
    return;
  }
  void updatePostDenormalizedTags(postId);
}

voteCallbacks.cancelSync.add(voteUpdatePostDenormalizedTags);
voteCallbacks.castVoteAsync.add(voteUpdatePostDenormalizedTags);

async function recomputeContributorScoresFor(votedRevision: DbRevision, vote: DbVote) {
  if (vote.collectionName !== "Revisions") return;
  if (votedRevision.collectionName !== "Tags") return;
  
  const tag = await Tags.findOne({_id: votedRevision.documentId});
  if (!tag) return;
  await updateDenormalizedContributorsList(tag);
}

voteCallbacks.castVoteAsync.add(async ({newDocument: revision, vote}: {newDocument: DbRevision, vote: DbVote}) => {
  await recomputeContributorScoresFor(revision, vote);
});

voteCallbacks.cancelAsync.add(async ({newDocument: revision, vote}: {newDocument: DbRevision, vote: DbVote}) => {
  await recomputeContributorScoresFor(revision, vote);
});
