import TagRels from "../../lib/collections/tagRels/collection";
import Tags from "../../lib/collections/tags/collection";
import { Globals, updateMutator } from "../vulcan-lib";
import { v4 as uuid } from 'uuid';
import { updatePostDenormalizedTags } from "../tagging/tagCallbacks";

const backfillParentTags = async (childTagSlug, parentTagSlug) => {
  const parentTag = (await Tags.find({slug: parentTagSlug}).fetch())[0];
  const childTag = (await Tags.find({slug: childTagSlug}).fetch())[0];
  const parentTagRelPostIds = (await TagRels.find({tagId: parentTag._id}).fetch()).map(rel => rel.postId);

  const childTagRelPostIds = (await TagRels.find({tagId: childTag._id}).fetch()).filter(rel => !parentTagRelPostIds.includes(rel.postId)).map(rel => rel.postId);

  const parentTagRelIds = childTagRelPostIds.map(_ => uuid({}).slice(0, 17));
  
  await updateMutator({
    collection: Tags,
    documentId: childTag._id,
    set: { parentTagId: parentTag._id },
    validate: false,
  });

  await TagRels.rawCollection().bulkWrite(childTagRelPostIds.map((postId, i) => ({
    insertOne: {
      document: {
        _id: parentTagRelIds[i],
        postId: postId,
        tagId: parentTag._id,
        createdAt: new Date(),
        baseScore: 1,
        afBaseScore: 1,
        extendedScore: {"agreement": 0, "approvalVoteCount": 1, "agreementVoteCount": 0},
        afExtendedScore: {"agreement": 0, "approvalVoteCount": 1, "agreementVoteCount": 0},
        score: 1,
        voteCount: 1,
        afVoteCount: 1,
        deleted: false,
        inactive: false,
        schemaVersion: 1,
      }
    }
  })));

  await Promise.all(childTagRelPostIds.map(async postId => {
    await updatePostDenormalizedTags(postId);
  }));
}

Globals.backfillParentTags = backfillParentTags;
