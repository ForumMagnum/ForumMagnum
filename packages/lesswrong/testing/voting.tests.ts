import { testStartup } from './testMain';
import { recalculateScore } from '../lib/scoring';
import { performVoteServer } from '../server/voteServer';
import { batchUpdateScore } from '../server/updateScores';
import { createDummyUser, createDummyPost, createDummyComment } from './utils'
import { Posts } from '../lib/collections/posts'
import { Comments } from '../lib/collections/comments'
import { getKarmaChanges, getKarmaChangeDateRange } from '../server/karmaChanges';
import { waitUntilCallbacksFinished } from '../lib/vulcan-lib';
import { slugify } from '../lib/vulcan-lib/utils';
import lolex from 'lolex';

testStartup();

describe('Voting', function() {
  describe('batchUpdating', function() {
    it('does not update if post is inactive', async () => {
      const user = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      await Posts.rawUpdateOne(post._id, {$set: {inactive: true}}); //Do after creation, since onInsert of inactive sets to false
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await batchUpdateScore({collection: Posts});
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0] as any).score.should.be.closeTo(preUpdatePost[0].score, 0.001);
      (updatedPost[0] as any).postedAt.should.be.closeTo(yesterday, 1000);
      (updatedPost[0] as any).inactive.should.be.true;
    });
    it('sets post to inactive if it is older than sixty days', async () => {
      const user = await createDummyUser();
      const sixty_days_ago = new Date().getTime()-(60*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: sixty_days_ago, inactive: false})
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].postedAt as any).should.be.closeTo(sixty_days_ago, 1000);
      (updatedPost[0].inactive as any).should.be.false;
    });
    it('should compute a higher score if post is categorized as frontpage and even higher if curated', async () => {
      const user = await createDummyUser();
      const normalPost = await createDummyPost(user, {baseScore: 10});
      const frontpagePost = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
      const curatedPost = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
      await batchUpdateScore({collection: Posts});
      const updatedNormalPost = await Posts.find({_id: normalPost._id}).fetch();
      const updatedFrontpagePost = await Posts.find({_id: frontpagePost._id}).fetch();
      const updatedCuratedPost = await Posts.find({_id: curatedPost._id}).fetch();

      (updatedFrontpagePost[0].score as any).should.be.above(updatedNormalPost[0].score + 1);
      (updatedCuratedPost[0].score as any).should.be.above(updatedFrontpagePost[0].score + 1);
    });
    it('produces the same result as `recalculateScore`', async () => {
      const user = await createDummyUser();
      const normalPost = await createDummyPost(user, {baseScore: 10});
      const frontpagePost = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
      const curatedPost = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
      await batchUpdateScore({collection: Posts});
      const updatedNormalPost = await Posts.find({_id: normalPost._id}).fetch();
      const updatedFrontpagePost = await Posts.find({_id: frontpagePost._id}).fetch();
      const updatedCuratedPost = await Posts.find({_id: curatedPost._id}).fetch();

      (updatedNormalPost[0].score as any).should.be.closeTo(recalculateScore(normalPost), 0.001);
      (updatedFrontpagePost[0].score as any).should.be.closeTo(recalculateScore(frontpagePost), 0.001);
      (updatedCuratedPost[0].score as any).should.be.closeTo(recalculateScore(curatedPost), 0.001);
    });
  });
  describe('performVoteServer', () => {
    it('sets post to active after voting', async () => {
      const user = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      await Posts.rawUpdateOne(post._id, {$set: {inactive: true}}); //Do after creation, since onInsert of inactive sets to false
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].postedAt as any).should.be.closeTo(yesterday, 1000);
      (updatedPost[0].inactive as any).should.be.false;
    });
    it('increases score after upvoting', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].score as any).should.be.above(preUpdatePost[0].score);
    });
    it('decreases score after downvoting', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallDownvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].score as any).should.be.below(preUpdatePost[0].score);
    });
    it('cancels upvote if downvoted after previous upvote', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: otherUser })
      await performVoteServer({ documentId: post._id, voteType: 'smallDownvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].score as any).should.be.below(preUpdatePost[0].score);
      (updatedPost[0].baseScore as any).should.be.equal(0);
    });
    it('cancels downvote if upvoted after previous upvote', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallDownvote', collection: Posts, user: otherUser })
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].score as any).should.be.above(preUpdatePost[0].score);
      (updatedPost[0].baseScore as any).should.be.equal(2);
    });
    describe('twoAxis agreement voting', () => {
      it('increases agreement score after upvoting', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: yesterday, votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallUpvote'}, collection: Comments, user: otherUser })
        const updatedComment = await Comments.find({_id: comment._id}).fetch();
  
        (updatedComment[0].extendedScore.agreement as any).should.be.above(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore) // confirm it doesn't alter regular overall votes
      });
      it('decreases agreement score after downvoting', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: yesterday, votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallDownvote'}, collection: Comments, user: otherUser })
        const updatedComment = await Comments.find({_id: comment._id}).fetch();
  
        (updatedComment[0].extendedScore.agreement as any).should.be.below(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore)
      });
      it('cancels upvote if downvoted after previous upvote', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: yesterday, votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallUpvote'}, collection: Comments, user: otherUser })
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallDownvote'}, collection: Comments, user: otherUser })
        const updatedComment = await Comments.find({_id: comment._id}).fetch();

        (updatedComment[0].extendedScore.agreement as any).should.be.below(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore)
      });
      it('cancels downvote if upvoted after previous upvote', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: yesterday, votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallDownvote'}, collection: Comments, user: otherUser })
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallUpvote'}, collection: Comments, user: otherUser })
        const updatedComment = await Comments.find({_id: comment._id}).fetch();

        (updatedComment[0].extendedScore.agreement as any).should.be.above(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore)
      });
    });
  })
  describe('getKarmaChanges', () => {
    it('includes posts in the selected date range', async () => {
      let clock = lolex.install({
        now: new Date("1980-01-01"),
        shouldAdvanceTime: true,
      });
      
      let poster = await createDummyUser();
      let voter = await createDummyUser();
      
      clock.setSystemTime(new Date("1980-01-01T13:00:00Z"));
      let post = await createDummyPost(poster);
      
      clock.setSystemTime(new Date("1980-01-01T13:30:00Z"));
      await performVoteServer({
        document: post,
        voteType: "smallUpvote",
        collection: Posts,
        user: voter,
      });
      
      let karmaChanges = await getKarmaChanges({
        user: poster,
        startDate: new Date("1980-01-01T13:20:00Z"),
        endDate: new Date("1980-01-01T13:40:00Z"),
      });
      
      (karmaChanges.totalChange as any).should.equal(1);
      
      karmaChanges.posts.length.should.equal(1);
      karmaChanges.posts[0].should.deep.equal({
        _id: post._id,
        scoreChange: 1,
        title: post.title,
        slug: slugify(post.title),
      });
      
      // TODO
      await waitUntilCallbacksFinished();
      clock.uninstall();
    });
    /*it('does not include posts outside the selected date range', async () => {
      // TODO
    });
    it('includes comments in the selected date range', async () => {
      // TODO
    });*/
  });
  describe('getKarmaChangeDateRange', () => {
    it('computes daily update times correctly', async () => {
      const updateAt5AMSettings = {
        updateFrequency: "daily",
        timeOfDayGMT: 5,
      };
      
      (getKarmaChangeDateRange({
        settings: updateAt5AMSettings,
        now: new Date("1980-03-03T08:00:00Z"),
        lastOpened: new Date("1980-03-03T06:00:00Z"),
      }) as any).should.deep.equal({
        start: new Date("1980-03-02T05:00:00Z"),
        end: new Date("1980-03-03T05:00:00Z"),
      });
      
      (getKarmaChangeDateRange({
        settings: updateAt5AMSettings,
        now: new Date("1980-03-03T03:00:00Z"),
        lastOpened: new Date("1980-03-03T02:00:00Z"),
      }) as any).should.deep.equal({
        start: new Date("1980-03-01T05:00:00Z"),
        end: new Date("1980-03-02T05:00:00Z"),
      });
      
      (getKarmaChangeDateRange({
        settings: updateAt5AMSettings,
        now: new Date("1980-03-03T08:00:00Z"),
        lastOpened: new Date("1980-02-02T08:00:00Z"),
      }) as any).should.deep.equal({
        start: new Date("1980-02-02T08:00:00Z"),
        end: new Date("1980-03-03T05:00:00Z"),
      });
    });
    it('computes weekly update times correctly', async () => {
      const updateSaturdayAt5AMSettings = {
        updateFrequency: "weekly",
        timeOfDayGMT: 5,
        dayOfWeekGMT: "Saturday",
      };
      (getKarmaChangeDateRange({
        settings: updateSaturdayAt5AMSettings,
        now: new Date("1980-05-03T08:00:00Z"), //Saturday
        lastOpened: new Date("1980-05-03T06:00:00Z"),
      }) as any).should.deep.equal({
        start: new Date("1980-04-26T05:00:00Z"),
        end: new Date("1980-05-03T05:00:00Z"),
      });
      (getKarmaChangeDateRange({
        settings: updateSaturdayAt5AMSettings,
        now: new Date("1980-05-07T08:00:00Z"), //Wednesday
        lastOpened: new Date("1980-05-07T06:00:00Z"),
      }) as any).should.deep.equal({
        start: new Date("1980-04-26T05:00:00Z"),
        end: new Date("1980-05-03T05:00:00Z"),
      })
    });
  });
})
