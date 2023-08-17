import "./integrationTestSetup";
import { updateDenormalizedContributorsList } from '../server/resolvers/tagResolvers';
import { createDummyUser, createDummyTag, createDummyRevision } from './utils';
import { performVoteServer } from '../server/voteServer';
import { waitUntilCallbacksFinished } from '../lib/vulcan-lib';
import Tags from '../lib/collections/tags/collection';
import Revisions from '../lib/collections/revisions/collection'

describe('Tagging', function() {
  describe('Contributors List', function() {
    it('can update denormalized contributors list', async () => {
      const user = await createDummyUser();
      const voter = await createDummyUser();
      const tag = await createDummyTag(user, {});
      const revision = await createDummyRevision(user, {
        documentId: tag._id,
        collectionName: 'Tags',
        fieldName: 'description',
        changeMetrics: {
          added: 10,
        },
      });
      await performVoteServer({ documentId: revision._id, voteType: 'smallUpvote', collection: Revisions, user, skipRateLimits: false });
      await performVoteServer({ documentId: revision._id, voteType: 'smallUpvote', collection: Revisions, user: voter, skipRateLimits: false });
      await updateDenormalizedContributorsList(tag);
      await waitUntilCallbacksFinished();
      const updatedTag = await Tags.find({_id: tag._id}).fetch();
      const stats = (updatedTag[0] as any).contributionStats;
      Object.keys(stats).length.should.be.equal(1);
      stats[user._id].contributionScore.should.be.equal(2);
      stats[user._id].numCommits.should.be.equal(1);
      stats[user._id].voteCount.should.be.equal(2);
    });
  });
});
