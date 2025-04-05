import "./integrationTestSetup";
import { recalculateScore } from '../lib/scoring';
import { performVoteServer } from '../server/voteServer';
import { batchUpdateScore } from '../server/updateScores';
import { createDummyUser, createDummyPost, createDummyComment, createManyDummyVotes, waitUntilCallbacksFinished } from './utils'
import { Users } from '../server/collections/users/collection'
import { Posts } from '../server/collections/posts/collection'
import { Comments } from '../server/collections/comments/collection'
import { getKarmaChanges, getKarmaChangeDateRange } from '../server/karmaChanges';
import { sleep } from "../lib/utils/asyncUtils";
import omitBy from "lodash/omitBy";
import isNil from "lodash/isNil";
import { slugify } from "@/lib/utils/slugify";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updatePost } from "@/server/collections/posts/mutations";

describe('Voting', function() {
  describe('batchUpdating', function() {
    it('does not update if post is inactive', async () => {
      const user = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: new Date(yesterday)})
      await Posts.rawUpdateOne(post._id, {$set: {inactive: true}}); //Do after creation, since onInsert of inactive sets to false
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await batchUpdateScore({collection: Posts});
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0] as any).score.should.be.closeTo(preUpdatePost[0].score, 0.001);
      (updatedPost[0] as any).postedAt.getTime().should.be.closeTo(yesterday, 1000);
      (updatedPost[0] as any).inactive.should.be.true;
    });
    it('sets post to inactive if it is older than sixty days', async () => {
      const user = await createDummyUser();
      const sixty_days_ago = new Date().getTime()-(60*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: new Date(sixty_days_ago), inactive: false})
      await waitUntilCallbacksFinished();

      const updatedPost = await Posts.find({_id: post._id}).fetch();
      (updatedPost[0].postedAt as any).getTime().should.be.closeTo(sixty_days_ago, 1000);
      (updatedPost[0].inactive as any).should.be.false;
    });
    it('should compute a higher score if post is categorized as frontpage and even higher if curated', async () => {
      const user = await createDummyUser();
      const normalPost = await createDummyPost(user, {baseScore: 10});
      const frontpagePost = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
      const curatedPost = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
      await waitUntilCallbacksFinished();
      // TODO: HACK - one of the callbacks seems to set normalPost.frontpageDate, but we want it to be null
      await Posts.rawUpdateOne({_id: normalPost._id}, {$set: {frontpageDate: null}});
      await batchUpdateScore({collection: Posts});
      const updatedNormalPost = await Posts.find({_id: normalPost._id}).fetch();
      const updatedFrontpagePost = await Posts.find({_id: frontpagePost._id}).fetch();
      const updatedCuratedPost = await Posts.find({_id: curatedPost._id}).fetch();

      (updatedFrontpagePost[0].score as any).should.be.above(updatedNormalPost[0].score + 1);
      (updatedCuratedPost[0].score as any).should.be.above(updatedFrontpagePost[0].score + 1);
    });
    it('produces the same result as `recalculateScore`', async () => {
      const user = await createDummyUser();
      const [normalPost, frontpagePost, curatedPost] = await Promise.all([
        createDummyPost(user, {baseScore: 10}),
        createDummyPost(user, {frontpageDate: new Date(), baseScore: 10}),
        createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10}),
      ]);
      await waitUntilCallbacksFinished();
      await batchUpdateScore({collection: Posts});
      const [updatedNormalPost, updatedFrontpagePost, updatedCuratedPost] = await Promise.all([
        Posts.findOne({_id: normalPost._id}),
        Posts.findOne({_id: frontpagePost._id}),
        Posts.findOne({_id: curatedPost._id}),
      ]);

      (updatedNormalPost?.score as any).should.be.closeTo(recalculateScore(normalPost), 0.002);
      (updatedFrontpagePost?.score as any).should.be.closeTo(recalculateScore(frontpagePost), 0.002);
      (updatedCuratedPost?.score as any).should.be.closeTo(recalculateScore(curatedPost), 0.002);
    });
  });
  describe('performVoteServer', () => {
    it('sets post to active after voting', async () => {
      const user = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: new Date(yesterday)})
      await Posts.rawUpdateOne(post._id, {$set: {inactive: true}}); //Do after creation, since onInsert of inactive sets to false
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user, skipRateLimits: false })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].postedAt as any).getTime().should.be.closeTo(yesterday, 1000);
      (updatedPost[0].inactive as any).should.be.false;
    });
    it('increases score after upvoting', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: new Date(yesterday)})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: otherUser, skipRateLimits: false })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].score as any).should.be.above(preUpdatePost[0].score);
    });
    it('decreases score after downvoting', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: new Date(yesterday)})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallDownvote', collection: Posts, user: otherUser, skipRateLimits: false })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].score as any).should.be.below(preUpdatePost[0].score);
    });
    it('cancels upvote if downvoted after previous upvote', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: new Date(yesterday)})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: otherUser, skipRateLimits: false })
      await performVoteServer({ documentId: post._id, voteType: 'smallDownvote', collection: Posts, user: otherUser, skipRateLimits: false })
      const updatedPost = await Posts.find({_id: post._id}).fetch();
      await waitUntilCallbacksFinished();

      (updatedPost[0].score as any).should.be.below(preUpdatePost[0].score);
      (updatedPost[0].baseScore as any).should.be.equal(0);
    });
    it('cancels downvote if upvoted after previous upvote', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: new Date(yesterday)})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await performVoteServer({ documentId: post._id, voteType: 'smallDownvote', collection: Posts, user: otherUser, skipRateLimits: false })
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: otherUser, skipRateLimits: false })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      (updatedPost[0].score as any).should.be.above(preUpdatePost[0].score);
      (updatedPost[0].baseScore as any).should.be.equal(2);
    });
    describe('twoAxis agreement voting', () => {
      it('increases agreement score after upvoting', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: new Date(yesterday), votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallUpvote'}, collection: Comments, user: otherUser, skipRateLimits: false })
        await waitUntilCallbacksFinished();
        const updatedComment = await Comments.find({_id: comment._id}).fetch();
  
        (updatedComment[0].extendedScore.agreement as any).should.be.above(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore) // confirm it doesn't alter regular overall votes
      });
      it('decreases agreement score after downvoting', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: new Date(yesterday), votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallDownvote'}, collection: Comments, user: otherUser, skipRateLimits: false })
        const updatedComment = await Comments.find({_id: comment._id}).fetch();
  
        (updatedComment[0].extendedScore.agreement as any).should.be.below(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore)
      });
      it('cancels upvote if downvoted after previous upvote', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: new Date(yesterday), votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallUpvote'}, collection: Comments, user: otherUser, skipRateLimits: false })
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallDownvote'}, collection: Comments, user: otherUser, skipRateLimits: false })
        const updatedComment = await Comments.find({_id: comment._id}).fetch();
        await waitUntilCallbacksFinished();

        (updatedComment[0].extendedScore.agreement as any).should.be.below(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore)
      });
      it('cancels downvote if upvoted after previous upvote', async () => {
        const user = await createDummyUser();
        const otherUser = await createDummyUser();
        const yesterday = new Date().getTime()-(1*24*60*60*1000)
        const post = await createDummyPost(user, {postedAt: new Date(yesterday), votingSystem: 'twoAxis'})
        const comment = await createDummyComment(user, {postId: post._id})
        const preUpdateComment = await Comments.find({_id: comment._id}).fetch();
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallDownvote'}, collection: Comments, user: otherUser, skipRateLimits: false })
        await performVoteServer({ documentId: comment._id, voteType: 'neutral', extendedVote: { agreement: 'smallUpvote'}, collection: Comments, user: otherUser, skipRateLimits: false })
        const updatedComment = await Comments.find({_id: comment._id}).fetch();

        (updatedComment[0].extendedScore.agreement as any).should.be.above(preUpdateComment[0].extendedScore.agreement);
        (updatedComment[0].baseScore as any).should.be.equal(preUpdateComment[0].baseScore)
      });
    });
    it('gives karma to author and co-authors', async () => {
      const author = await createDummyUser();
      const coauthor = await createDummyUser();
      const voter = await createDummyUser();
      const yesterday = new Date().getTime() - (1 * 24 * 60 * 60 * 1000);
      const post = await createDummyPost(author, {
        postedAt: new Date(yesterday),
        coauthorStatuses: [ { userId: coauthor._id, confirmed: true, } ],
      });

      expect(author.karma).toBe(0);
      expect(coauthor.karma).toBe(0);

      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: voter, skipRateLimits: false });
      await waitUntilCallbacksFinished();

      const updatedAuthor = (await Users.find({_id: author._id}).fetch())[0];
      const updatedCoauthor = (await Users.find({_id: coauthor._id}).fetch())[0];
      (updatedAuthor.karma as any).should.be.equal(1);
      (updatedCoauthor.karma as any).should.be.equal(1);
    });
    it('cancelling an old vote after a new co-author is added doesn\'t affect their karma', async () => {
      const author = await createDummyUser({ karma: 0 });
      const coauthor = await createDummyUser({ karma: 0 });
      const voter = await createDummyUser();
      const yesterday = new Date().getTime() - (1 * 24 * 60 * 60 * 1000);
      const post = await createDummyPost(author, {
        postedAt: new Date(yesterday),
      });

      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: voter, skipRateLimits: false });
      await waitUntilCallbacksFinished();

      let updatedAuthor = (await Users.find({_id: author._id}).fetch())[0];
      let updatedCoauthor = (await Users.find({_id: coauthor._id}).fetch())[0];
      expect(updatedAuthor.karma).toBe(1);
      expect(updatedCoauthor.karma).toBe(0);

      await updatePost({
        data: {
          coauthorStatuses: [ { userId: coauthor._id, confirmed: true, requested: true } ]
        },
        selector: { _id: post._id }
      }, createAnonymousContext(), true);

      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: voter, skipRateLimits: false });
      await waitUntilCallbacksFinished();

      updatedAuthor = (await Users.find({_id: author._id}).fetch())[0];
      updatedCoauthor = (await Users.find({_id: coauthor._id}).fetch())[0];
      expect(updatedAuthor.karma).toBe(0);
      expect(updatedCoauthor.karma).toBe(0);
    });
  })
  describe('checkRateLimit', () => {
    it('limits votes on posts', async () => {
      const voter = await createDummyUser();
      const author = await createDummyUser();
      const post = await createDummyPost(author);
      const maxVotesPerHour = 100;
      await createManyDummyVotes(maxVotesPerHour, voter);
      await expect(async () => {
        await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: voter, skipRateLimits: false });
      }).rejects.toThrow("Voting rate limit exceeded: too many votes in one hour");
    });
    it("self-votes don't count towards rate limit", async () => {
      const voter = await createDummyUser();
      const post = await createDummyPost(voter);
      const maxVotesPerHour = 100;
      await createManyDummyVotes(maxVotesPerHour, voter);
      await performVoteServer({ documentId: post._id, voteType: 'smallUpvote', collection: Posts, user: voter, skipRateLimits: false });
    });
  })
  describe('getKarmaChanges', () => {
    it('includes authored posts in the selected date range', async () => {
      const postedAt = new Date(Date.now() - 30000);

      const poster = await createDummyUser();
      const voter = await createDummyUser();
      const post = await createDummyPost(poster, {createdAt: postedAt});

      await performVoteServer({
        document: post,
        voteType: "smallUpvote",
        collection: Posts,
        user: voter,
        skipRateLimits: false,
      });

      const karmaChanges = await getKarmaChanges({
        user: poster,
        startDate: new Date(Date.now() - 10000),
        endDate: new Date(Date.now() + 10000),
        context: createAnonymousContext(),
      });

      (karmaChanges.totalChange as any).should.equal(1);
      karmaChanges.posts.length.should.equal(1);
      const resultPost = omitBy(karmaChanges.posts[0], isNil);
      resultPost.should.deep.equal({
        _id: post._id,
        postId: post._id,
        collectionName: "Posts",
        addedReacts: [],
        scoreChange: 1,
        title: post.title,
        slug: slugify(post.title),
      });
    });
    it('includes co-authored posts in the selected date range', async () => {
      const postedAt = new Date(Date.now() - 30000);

      const author = await createDummyUser();
      const coauthor = await createDummyUser();
      const voter = await createDummyUser();
      const post = await createDummyPost(author, {
        createdAt: postedAt,
        coauthorStatuses: [ { userId: coauthor._id, confirmed: true, } ],
      });

      await performVoteServer({
        document: post,
        voteType: "smallUpvote",
        collection: Posts,
        user: voter,
        skipRateLimits: false,
      });

      const karmaChanges = await getKarmaChanges({
        user: coauthor,
        startDate: new Date(Date.now() - 10000),
        endDate: new Date(Date.now() + 10000),
        context: createAnonymousContext(),
      });

      (karmaChanges.totalChange as any).should.equal(1);
      karmaChanges.posts.length.should.equal(1);
      const resultPost = omitBy(karmaChanges.posts[0], isNil);
      resultPost.should.deep.equal({
        _id: post._id,
        postId: post._id,
        collectionName: "Posts",
        addedReacts: [],
        scoreChange: 1,
        title: post.title,
        slug: slugify(post.title),
      });
    });
    it('does not include posts outside the selected date range', async () => {
      const postedAt = new Date(Date.now() - 30000);

      const poster = await createDummyUser();
      const voter = await createDummyUser();
      const post = await createDummyPost(poster, {createdAt: postedAt});

      await performVoteServer({
        document: post,
        voteType: "smallUpvote",
        collection: Posts,
        user: voter,
        skipRateLimits: false,
      });

      await sleep(5);

      const karmaChanges = await getKarmaChanges({
        user: poster,
        startDate: new Date(Date.now() - 1),
        endDate: new Date(Date.now() + 10000),
        context: createAnonymousContext(),
      });

      (karmaChanges.totalChange as any).should.equal(0);
      karmaChanges.posts.length.should.equal(0);
    });
    it('includes comments in the selected date range', async () => {
      const postedAt = new Date(Date.now() - 30000);

      const poster = await createDummyUser();
      const voter = await createDummyUser();
      const post = await createDummyPost(poster, {createdAt: postedAt});
      const comment = await createDummyComment(poster, {postId: post._id});

      await performVoteServer({
        document: comment,
        voteType: "smallUpvote",
        collection: Comments,
        user: voter,
        skipRateLimits: false,
      });

      const karmaChanges = await getKarmaChanges({
        user: poster,
        startDate: new Date(Date.now() - 10000),
        endDate: new Date(Date.now() + 10000),
        context: createAnonymousContext(),
      });

      (karmaChanges.totalChange as any).should.equal(1);
      karmaChanges.comments.length.should.equal(1);
      const resultComment = omitBy(karmaChanges.comments[0], isNil);
      resultComment.should.deep.equal({
        _id: comment._id,
        commentId: comment._id,
        collectionName: "Comments",
        addedReacts: [],
        scoreChange: 1,
        postId: post._id,
        postTitle: post.title,
        postSlug: slugify(post.title),
        tagCommentType: "DISCUSSION",
        description: "This is a test comment",
      });
    });
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
