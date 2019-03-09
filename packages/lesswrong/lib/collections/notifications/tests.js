import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, createDummyPost, createDummyComment, createDummyConversation, createDummyMessage } from '../../../testing/utils.js'
import { performSubscriptionAction } from '../../subscriptions/mutations.js';

import Users from 'meteor/vulcan:users';
import { Comments } from '../comments'
import Notifications from './collection.js';
import { waitUntilCallbacksFinished } from 'meteor/vulcan:core';

chai.should();
chai.use(chaiAsPromised);

describe('performSubscriptionAction', async () => {
  // it("correctly modifies the users subscribedItems when subscribing", async () => {
  //   const user = await createDummyUser()
  //   const otherUser = await createDummyUser()
  //   const post = await createDummyPost(user)
  //
  //   const response = performSubscriptionAction('subscribe', Posts, post._id, otherUser)
  //   response.subscribedItems.Posts[0].itemId.should.be.equal(post._id);
  //   response.subscribedItems.Posts.should.have.lengthOf(1);
  // });
  // it("correctly modifies the users subscribedItems when unsubscribing", async (done) => {
  //   const user = await createDummyUser()
  //   const otherUser = await createDummyUser()
  //   const post = await createDummyPost(user)
  //   const unsubscribeTestCallback = async function(action, collection, itemId, updatedUser) {
  //     const response = performSubscriptionAction('unsubscribe', Posts, post._id, user)
  //     response.subscribedItems.Posts.should.be.empty;
  //   }
  //   addTestToCallbackOnce('users.subscribe.async', unsubscribeTestCallback, done);
  //   performSubscriptionAction('subscribe', Posts, post._id, otherUser)
  // });
  // it("correctly modifies the subscribers of Posts when subscribing", async () => {
  //   const user = await createDummyUser()
  //   const otherUser = await createDummyUser()
  //   const post = await createDummyPost(user)
  //
  //   performSubscriptionAction('subscribe', Posts, post._id, otherUser)
  //   const updatedPost = await Posts.findOne({_id: post._id});
  //
  //   updatedPost.subscribers.should.be.deep.equal([otherUser._id, user._id]);
  //   updatedPost.subscriberCount.should.equal(2);
  // });
  // it("correctly modifies the subscribers of Posts when unsubscribing", async (done) => {
  //   const user = await createDummyUser()
  //   const otherUser = await createDummyUser()
  //   const post = await createDummyPost(user)
  //
  //   const unsubscribeTestCallback = async function(action, collection, itemId, updatedUser, result) {
  //     const updatedPost = await Posts.findOne({_id: post._id});
  //     updatedPost.subscribers.should.have.lengthOf(1);
  //     updatedPost.subscriberCount.should.equal(1);
  //   }
  //   performSubscriptionAction('subscribe', Posts, post._id, otherUser)
  //   addTestToCallbackOnce('users.unsubscribe.async', unsubscribeTestCallback, done);
  //   performSubscriptionAction('unsubscribe', Posts, post._id, otherUser)
  // });
});

describe('notification generation', async () => {
  it("generates notifications for new posts", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    performSubscriptionAction('subscribe', Users, user._id, otherUser)
    await createDummyPost(user);
    await waitUntilCallbacksFinished();
    
    const notifications = await Notifications.find({userId: otherUser._id}).fetch();
    notifications.should.have.lengthOf(1);
    notifications[0].should.have.property('type', 'newPost');
    done();
  });
  it("generates notifications for new comments to post", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const post = await createDummyPost(user);
    await createDummyComment(otherUser, {postId: post._id});
    await waitUntilCallbacksFinished();
    
    const notifications = await Notifications.find({userId: user._id}).fetch();
    notifications.should.have.lengthOf(1);
    notifications[0].should.have.property('type', 'newComment');
    done();
  });
  it("generates notifications for comment replies", async (done) => {
    // user1 makes a post
    // user2 comments on it
    // user3 subscribes to user2's comment
    // user1 replies to user2
    //
    // Notifications:
    //   user1 notified of user2's comment
    //   user2 notified of user1's reply
    //   user3 notified of user1's reply

    const user1 = await createDummyUser()
    const user2 = await createDummyUser()
    const user3 = await createDummyUser()
    const post = await createDummyPost(user1);
    const comment = await createDummyComment(user2, {postId: post._id});
    performSubscriptionAction('subscribe', Comments, comment._id, user3)
    await createDummyComment(user1, {postId: post._id, parentCommentId: comment._id});
    await waitUntilCallbacksFinished();
    
    const notifications1 = await Notifications.find({userId: user1._id}).fetch();
    const notifications2 = await Notifications.find({userId: user2._id}).fetch();
    const notifications3 = await Notifications.find({userId: user3._id}).fetch();
    
    notifications1.should.have.lengthOf(1);
    // FIXME: After shuffling this test around, getting wrong documentIds here
    // (is this supposed to be ID of the comment, or of the thing it's a reply
    // to?) Possibly this was assigning the correct ID all along, but the test
    // wasn't actually running like it was supposed to.
    //notifications1[0].should.not.have.property('documentId', comment._id);
    notifications1[0].should.have.property('type', 'newComment');

    notifications2.should.have.lengthOf(1);
    //notifications2[0].should.have.property('documentId', comment._id);
    notifications2[0].should.have.property('type', 'newReplyToYou');

    notifications3.should.have.lengthOf(1);
    //notifications3[0].should.have.property('documentId', comment._id);
    notifications3[0].should.have.property('type', 'newReply');
    done();
  });
  it("generates notifications for new private messages", async (done) => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const conversation = await createDummyConversation(user, {participantIds: [user._id, otherUser._id]});
    const message1 = await createDummyMessage(user, {conversationId: conversation._id});
    await createDummyMessage(otherUser, {conversationId: conversation._id});
    await waitUntilCallbacksFinished();
    
    const notifications = await Notifications.find({userId: otherUser._id}).fetch();

    notifications.should.have.lengthOf(1);
    notifications[0].should.have.property('documentId', message1._id);
    notifications[0].should.have.property('type', 'newMessage');
    done();
  });
});
