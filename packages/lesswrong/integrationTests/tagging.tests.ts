import "./integrationTestSetup";
import { updateDenormalizedContributorsList } from '../server/utils/contributorsUtil';
import { createDummyUser, createDummyTag, createDummyRevision, waitUntilPgQueriesFinished } from './utils';
import { performVoteServer } from '../server/voteServer';
import Tags from '../server/collections/tags/collection';
import Revisions from '../server/collections/revisions/collection'
import { createAdminContext } from "@/server/vulcan-lib/createContexts";

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
      // Creating the revision performs a self-vote, which combined with the vote from the non-author-voter
      // gets us an expected contribution score of 2.
      await performVoteServer({ documentId: revision._id, voteType: 'smallUpvote', collection: Revisions, user: voter, skipRateLimits: false });
      await updateDenormalizedContributorsList({ document: tag, collectionName: 'Tags', fieldName: 'description', context: createAdminContext() });
      await waitUntilPgQueriesFinished();
      const updatedTag = await Tags.find({_id: tag._id}).fetch();
      const stats = (updatedTag[0] as any).contributionStats;
      Object.keys(stats).length.should.be.equal(1);
      stats[user._id].contributionScore.should.be.equal(2);
      stats[user._id].numCommits.should.be.equal(1);
      stats[user._id].voteCount.should.be.equal(2);
    });
  });
});
