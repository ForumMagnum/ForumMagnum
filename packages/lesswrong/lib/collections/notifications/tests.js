import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, createDummyPost, addTestToCallbackOnce, createDummyComment, createDummyConversation, createDummyMessage } from '../../../testing/utils.js'
import { performSubscriptionAction } from '../../subscriptions/mutations.js';

import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum'
import Notifications from './collection.js';

chai.should();
chai.use(chaiAsPromised);

describe('performSubscriptionAction', async () => {
  it("correctly modifies the users subscribedItems when subscribing", async () => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const post = await createDummyPost(user)

    const response = performSubscriptionAction('subscribe', Posts, post._id, otherUser)
    response.subscribedItems.Posts[0].itemId.should.be.equal(post._id);
    response.subscribedItems.Posts.should.have.lengthOf(1);
  });
  it("correctly modifies the users subscribedItems when unsubscribing", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const post = await createDummyPost(user)
    const unsubscribeTestCallback = async function(action, collection, itemId, updatedUser) {
      const response = performSubscriptionAction('unsubscribe', Posts, post._id, user)
      response.subscribedItems.Posts.should.be.empty;
    }
    addTestToCallbackOnce('users.subscribe.async', unsubscribeTestCallback, done);
    performSubscriptionAction('subscribe', Posts, post._id, otherUser)
  });
  it("correctly modifies the subscribers of Posts when subscribing", async () => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const post = await createDummyPost(user)

    performSubscriptionAction('subscribe', Posts, post._id, otherUser)
    const updatedPost = await Posts.findOne({_id: post._id});

    updatedPost.subscribers.should.be.deep.equal([otherUser._id, user._id]);
    updatedPost.subscriberCount.should.equal(2);
  });
  it("correctly modifies the subscribers of Posts when unsubscribing", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const post = await createDummyPost(user)

    const unsubscribeTestCallback = async function(action, collection, itemId, updatedUser, result) {
      const updatedPost = await Posts.findOne({_id: post._id});
      updatedPost.subscribers.should.have.lengthOf(1);
      updatedPost.subscriberCount.should.equal(1);
    }
    performSubscriptionAction('subscribe', Posts, post._id, otherUser)
    addTestToCallbackOnce('users.unsubscribe.async', unsubscribeTestCallback, done);
    performSubscriptionAction('unsubscribe', Posts, post._id, otherUser)
  });
});

describe('notification generation', async () => {
  it("generates notifications for new posts", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    async function testNotificationGeneration(post) {
      const notifications = await Notifications.find({userId: otherUser._id}).fetch();
      notifications.should.have.lengthOf(1);
      notifications[0].should.have.property('documentId', post._id);
      notifications[0].should.have.property('type', 'newPost');
    }
    addTestToCallbackOnce('posts.new.async', testNotificationGeneration, done);
    performSubscriptionAction('subscribe', Users, user._id, otherUser)
    await createDummyPost(user);
  });
  it("generates notifications for new comments to post", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    async function commentTestNotificationGeneration(comment) {
      const notifications = await Notifications.find({userId: user._id}).fetch();
      notifications.should.have.lengthOf(1);
      notifications[0].should.have.property('documentId', comment._id);
      notifications[0].should.have.property('type', 'newComment');
    }
    addTestToCallbackOnce('comments.new.async', commentTestNotificationGeneration, done);
    const post = await createDummyPost(user);
    await createDummyComment(otherUser, {postId: post._id});
  });
  it("generates notifications for comment replies", async (done) => {
    const user1 = await createDummyUser()
    const user2 = await createDummyUser()
    const user3 = await createDummyUser()
    async function commentTestNotificationGeneration(comment) {
      const notifications1 = await Notifications.find({userId: user1._id}).fetch();
      const notifications2 = await Notifications.find({userId: user2._id}).fetch();
      const notifications3 = await Notifications.find({userId: user3._id}).fetch();

      notifications1.should.have.lengthOf(1);
      notifications1[0].should.not.have.property('documentId', comment._id);
      notifications1[0].should.have.property('type', 'newComment');

      notifications2.should.have.lengthOf(1);
      notifications2[0].should.have.property('documentId', comment._id);
      notifications2[0].should.have.property('type', 'newReplyToYou');

      notifications3.should.have.lengthOf(1);
      notifications3[0].should.have.property('documentId', comment._id);
      notifications3[0].should.have.property('type', 'newReply');
    }
    const post = await createDummyPost(user1);
    const comment = await createDummyComment(user2, {postId: post._id});
    performSubscriptionAction('subscribe', Comments, comment._id, user3)
    addTestToCallbackOnce('comments.new.async', commentTestNotificationGeneration, done);
    await createDummyComment(user1, {postId: post._id, parentCommentId: comment._id});
  });
  it("generates notifications for new private messages", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    async function messageTestNotificationGeneration(message) {
      const notifications = await Notifications.find({userId: otherUser._id}).fetch();

      notifications.should.have.lengthOf(1);
      notifications[0].should.have.property('documentId', message1._id);
      notifications[0].should.have.property('type', 'newMessage');
    }
    const conversation = await createDummyConversation(user, {participantIds: [user._id, otherUser._id]});
    const message1 = await createDummyMessage(user, {conversationId: conversation._id});
    await createDummyMessage(otherUser, {conversationId: conversation._id});
    addTestToCallbackOnce('messages.new.async', messageTestNotificationGeneration, done);

  });
});
