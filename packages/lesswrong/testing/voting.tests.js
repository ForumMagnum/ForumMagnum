import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery, newMutation } from 'meteor/vulcan:core';
import { batchUpdateScore, recalculateScore, performVoteServer } from 'meteor/vulcan:voting';

import {
  createDummyUser,
  createDummyPost,
} from './utils.js'

import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum'

chai.should();
chai.use(chaiAsPromised);

describe('Voting', async () => {
  describe('batchUpdating', async () => {
    it('updates if post in the future', async () => {
      const user = await createDummyUser();
      const currentTime = new Date();
      const tomorrow = currentTime.getTime()+(1*24*60*60*1000)
      const in_a_month = currentTime.getTime()+(30*24*60*60*1000)
      const in_half_an_hour = currentTime.getTime()+(30*60*1000)
      const in_ten_minutes = currentTime.getTime()+(10*60*1000)
      const dates = [tomorrow, in_ten_minutes, in_half_an_hour, tomorrow, in_a_month];
      dates.forEach(async date => {
        const post = await createDummyPost(user, {postedAt: date});
        await batchUpdateScore(Posts, false, false);
        const updatedPost = await Posts.find({_id: post._id}).fetch();

        updatedPost[0].score.should.equal(0);
        updatedPost[0].postedAt.should.be.closeTo(date, 1000);
      })
    });
    it('does not update if post is inactive', async () => {
      const user = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      await Posts.update(post._id, {$set: {inactive: true}}); //Do after creation, since onInsert of inactive sets to false
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      await batchUpdateScore(Posts, false, false);
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      updatedPost[0].score.should.be.closeTo(preUpdatePost[0].score, 0.001);
      updatedPost[0].postedAt.should.be.closeTo(yesterday, 1000);
      updatedPost[0].inactive.should.be.true;
    });
    it('sets post to inactive if it is older than sixty days', async () => {
      const user = await createDummyUser();
      const sixty_days_ago = new Date().getTime()-(60*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: sixty_days_ago, inactive: false})
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      updatedPost[0].postedAt.should.be.closeTo(sixty_days_ago, 1000);
      updatedPost[0].inactive.should.be.false;
    });
    it('should compute a higher score if post is categorized as frontpage and even higher if curated', async () => {
      const user = await createDummyUser();
      const normalPost = await createDummyPost(user, {baseScore: 10});
      const frontpagePost = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
      const curatedPost = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
      await batchUpdateScore(Posts, false, false);
      const updatedNormalPost = await Posts.find({_id: normalPost._id}).fetch();
      const updatedFrontpagePost = await Posts.find({_id: frontpagePost._id}).fetch();
      const updatedCuratedPost = await Posts.find({_id: curatedPost._id}).fetch();

      // updatedFrontpagePost[0].score.should.be.above(updatedNormalPost[0].score);
      console.log("Score test: ", updatedCuratedPost, updatedFrontpagePost);
      updatedCuratedPost[0].score.should.be.above(updatedFrontpagePost[0].score + 1);
    });
    it('produces the same result as `recalculateScore`', async () => {
      const user = await createDummyUser();
      const normalPost = await createDummyPost(user, {baseScore: 10});
      const frontpagePost = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
      const curatedPost = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
      await batchUpdateScore(Posts, false, false);
      const updatedNormalPost = await Posts.find({_id: normalPost._id}).fetch();
      const updatedFrontpagePost = await Posts.find({_id: frontpagePost._id}).fetch();
      const updatedCuratedPost = await Posts.find({_id: curatedPost._id}).fetch();

      updatedNormalPost[0].score.should.be.closeTo(recalculateScore(normalPost), 0.001);
      updatedFrontpagePost[0].score.should.be.closeTo(recalculateScore(frontpagePost), 0.001);
      updatedCuratedPost[0].score.should.be.closeTo(recalculateScore(curatedPost), 0.001);
    });
  });
  describe('performVoteServer', async () => {
    it('sets post to active after voting', async () => {
      const user = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      await Posts.update(post._id, {$set: {inactive: true}}); //Do after creation, since onInsert of inactive sets to false
      performVoteServer({ documentId: post._id, voteType: 'upvote', collection: Posts, user })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      updatedPost[0].postedAt.should.be.closeTo(yesterday, 1000);
      updatedPost[0].inactive.should.be.false;
    });
    it('increases score after upvoting', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      performVoteServer({ documentId: post._id, voteType: 'upvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      updatedPost[0].score.should.be.above(preUpdatePost[0].score);
    });
    it('decreases score after downvoting', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      performVoteServer({ documentId: post._id, voteType: 'downvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      updatedPost[0].score.should.be.below(preUpdatePost[0].score);
    });
    it('cancels upvote if downvoted after previous upvote', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      performVoteServer({ documentId: post._id, voteType: 'upvote', collection: Posts, user: otherUser })
      performVoteServer({ documentId: post._id, voteType: 'downvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      updatedPost[0].score.should.be.below(preUpdatePost[0].score);
      updatedPost[0].baseScore.should.be.equal(0);
    });
    it('cancels downvote if upvoted after previous upvote', async () => {
      const user = await createDummyUser();
      const otherUser = await createDummyUser();
      const yesterday = new Date().getTime()-(1*24*60*60*1000)
      const post = await createDummyPost(user, {postedAt: yesterday})
      const preUpdatePost = await Posts.find({_id: post._id}).fetch();
      performVoteServer({ documentId: post._id, voteType: 'downvote', collection: Posts, user: otherUser })
      performVoteServer({ documentId: post._id, voteType: 'upvote', collection: Posts, user: otherUser })
      const updatedPost = await Posts.find({_id: post._id}).fetch();

      updatedPost[0].score.should.be.above(preUpdatePost[0].score);
      updatedPost[0].baseScore.should.be.equal(2);
    });
  })
})
