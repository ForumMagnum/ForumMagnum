import TagRels from "../../lib/collections/tagRels/collection";
import Tags from "../../lib/collections/tags/collection";
import { Globals } from "../../lib/vulcan-lib/config";
import { updatePostDenormalizedTags } from '../tagging/helpers';
import { randomId } from "../../lib/random";

const backfillParentTags = async (parentTagSlug: string) => {
  const parentTag = (await Tags.find({slug: parentTagSlug}).fetch())[0];
  const childTags = (await Tags.find({parentTagId: parentTag._id}).fetch());
  for (const childTag of childTags) {
    // For use in determine what already exists - no need to add
    const parentTagRelPostIds = (await TagRels.find({tagId: parentTag._id, deleted: false}).fetch()).map(rel => rel.postId);
    const childTagRelPostIds = (await TagRels.find({tagId: childTag._id, baseScore: {$gt: 0}, deleted: false}).fetch())
      .filter(rel => !parentTagRelPostIds.includes(rel.postId))
      .map(rel => rel.postId);
    const parentTagRelIds = childTagRelPostIds.map(_ => randomId())

    // eslint-disable-next-line no-console
    console.log(`Adding ${childTagRelPostIds.length} tagRels for ${childTag.name} to ${parentTag.name}`);

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
          backfilled: true,
          userId: null,
          legacyData: null,
        }
      }
    })));
  
    await Promise.all(childTagRelPostIds.map(async postId => {
      await updatePostDenormalizedTags(postId);
    }));
  }
}

Globals.backfillParentTags = backfillParentTags;
