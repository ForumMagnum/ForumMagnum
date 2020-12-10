import { Tags, tagDescriptionEditableOptions } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { addEditableCallbacks } from '../editor/make_editable_callbacks'
import Users from '../../lib/collections/users/collection';
import { voteCallbacks } from '../../lib/voting/vote';
import { performVoteServer } from '../voteServer';
import { getCollectionHooks } from '../mutationCallbacks';

function isValidTagName(name: string) {
  return true;
}

function normalizeTagName(name: string) {
  // If the name starts with a hash, strip it off
  if (name.startsWith("#"))
    return name.substr(1);
  else
    return name;
}

export async function updatePostDenormalizedTags(postId: string) {
  const tagRels: Array<DbTagRel> = await TagRels.find({postId: postId, deleted:false}).fetch();
  const tagRelDict: Partial<Record<string,number>> = {};
  
  for (let tagRel of tagRels) {
    if (tagRel.baseScore > 0)
      tagRelDict[tagRel.tagId] = tagRel.baseScore;
  }
  
  await Posts.update({_id:postId}, {$set: {tagRelevance: tagRelDict}});
}

getCollectionHooks("Tags").createValidate.add((validationErrors: Array<any>, {document: tag}: {document: DbTag}) => {
  if (!tag.name || !tag.name.length)
    throw new Error("Name is required");
  if (!isValidTagName(tag.name))
    throw new Error("Invalid tag name (use only letters, digits and dash)");
  
  // If the name starts with a hash, strip it off
  const normalizedName = normalizeTagName(tag.name);
  if (tag.name !== normalizedName) {
    tag = {
      ...tag,
      name: normalizedName,
    };
  }
  
  // Name must be unique
  const existing = Tags.find({name: normalizedName, deleted:false}).fetch();
  if (existing.length > 0)
    throw new Error("A tag by that name already exists");
});

getCollectionHooks("Tags").updateValidate.add((validationErrors: Array<any>, {oldDocument, newDocument}: {oldDocument: DbTag, newDocument: DbTag}) => {
  const newName = normalizeTagName(newDocument.name);
  if (oldDocument.name !== newName) { // Tag renamed?
    if (!isValidTagName(newDocument.name))
      throw new Error("Invalid tag name");
    
    const existing = Tags.find({name: newName, deleted:false}).fetch();
    if (existing.length > 0)
      throw new Error("A tag by that name already exists");
  }
  
  if (newDocument.name !== newName) {
    newDocument = {
      ...newDocument, name: newName
    }
  }
});

getCollectionHooks("Tags").updateAfter.add(async (newDoc: DbTag, {oldDocument}: {oldDocument: DbTag}) => {
  // If this is soft deleting a tag, then cascade to also soft delete any
  // tagRels that go with it.
  if (newDoc.deleted && !oldDocument.deleted) {
    TagRels.update({ tagId: newDoc._id }, { $set: { deleted: true } }, { multi: true });
  }
  return newDoc;
});

getCollectionHooks("TagRels").newAfter.add(async (tagRel: DbTagRel) => {
  // When you add a tag, vote for it as relevant
  var tagCreator = Users.findOne(tagRel.userId);
  const votedTagRel = tagCreator && await performVoteServer({ document: tagRel, voteType: 'smallUpvote', collection: TagRels, user: tagCreator })
  await updatePostDenormalizedTags(tagRel.postId);
  return {...tagRel, ...votedTagRel} as DbTagRel;
});

function voteUpdatePostDenormalizedTags({newDocument: tagRel, vote}: {
  newDocument: DbTagRel,
  vote: DbVote
}) {
  void updatePostDenormalizedTags(tagRel.postId);
}

voteCallbacks.cancelSync.add(voteUpdatePostDenormalizedTags);
voteCallbacks.castVoteAsync.add(voteUpdatePostDenormalizedTags);

addEditableCallbacks({
  collection: Tags,
  options: tagDescriptionEditableOptions,
});
