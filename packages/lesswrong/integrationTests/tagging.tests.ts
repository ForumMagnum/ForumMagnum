import "./integrationTestSetup";
import { updateDenormalizedContributorsList } from '../server/utils/contributorsUtil';
import { createDummyUser, createDummyTag, createDummyRevision, waitUntilPgQueriesFinished } from './utils';
import { performVoteServer } from '../server/voteServer';
import Tags from '../server/collections/tags/collection';
import Revisions from '../server/collections/revisions/collection'
import { createAdminContext, createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { Votes } from '../server/collections/votes/collection';
import { createTag } from '../server/collections/tags/mutations';
import { getStoredOriginalContentsForRevision } from '@/lib/collections/revisions/helpers';

describe('Tagging', function() {
  describe('Contributors List', function() {
    it('can update denormalized contributors list', async () => {
      const user = await createDummyUser();
      const voter = await createDummyUser();
      const tag = await createDummyTag(user, {});
      const context = await computeContextFromUser({user: user as DbUser, isSSR: false});
      const revision = await createDummyRevision({
        originalContents: { type: 'ckEditorMarkup', data: '<p>Test contribution content</p>', yjsState: null },
        documentId: tag._id,
        collectionName: 'Tags',
        fieldName: 'description',
        previousHtmlForChangeMetrics: "",
      }, context);
      // Creating the revision performs a self-vote, which combined with the vote from the non-author-voter
      // gets us an expected contribution score of 2.
      await performVoteServer({
      context: createAnonymousContext({ forumType: "LessWrong" }), documentId: revision._id, voteType: 'smallUpvote', collection: Revisions, user: voter, skipRateLimits: false });
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
  describe('Creating a tag', function() {
    it("gives the initial description revision the tag's _id, a single self-vote, and matching denormalized contents", async () => {
      const user = await createDummyUser();
      const context = await computeContextFromUser({user, isSSR: false});
      const tag = await createTag({
        data: {
          name: "Test Tag",
          description: {
            originalContents: { type: 'ckEditorMarkup', data: '<p>Test description</p>' },
          },
        },
      }, context);
      await waitUntilPgQueriesFinished();

      const revision = await Revisions.findOne({_id: tag.description_latest});
      expect(revision?.documentId).toBe(tag._id);

      const selfVotes = await Votes.find({documentId: revision?._id, userId: user._id, cancelled: false}).fetch();
      expect(selfVotes).toHaveLength(1);

      const storedTag = await Tags.findOne({_id: tag._id});
      const revisionContents = revision ? await getStoredOriginalContentsForRevision(revision, context) : null;
      expect(revisionContents).toEqual({ type: 'ckEditorMarkup', data: '<p>Test description</p>', yjsState: null });
      expect(storedTag?.description).toEqual(expect.objectContaining({ originalContents: revisionContents }));
    });
  });
});
