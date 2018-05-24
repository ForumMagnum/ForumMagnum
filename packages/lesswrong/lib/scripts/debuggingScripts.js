/* global Vulcan */
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { createDummyMessage, createDummyConversation, createDummyPost, createDummyComment } from '../../testing/utils.js';
import { performSubscriptionAction } from '../subscriptions/mutations.js';

Vulcan.populateNotifications = async ({username,
  messageNotifications = 3,
  postNotifications = 3,
  commentNotifications = 3,
  replyNotifications = 3 }) =>
{
  const user = Users.findOne({username});
  const randomUser = Users.findOne({_id: {$ne: user._id}});
  if (messageNotifications > 0) {
    //eslint-disable-next-line no-console
    console.log("generating new messages...")
    const conversation = await createDummyConversation(randomUser, {participantIds: [randomUser._id, user._id]});
    _.times(messageNotifications, () => createDummyMessage(randomUser, {conversationId: conversation._id}))
  }
  if (postNotifications > 0) {
    //eslint-disable-next-line no-console
    console.log("generating new posts...")
    try {
      performSubscriptionAction('subscribe', Users, randomUser._id, user)
    } catch(err) {
      //eslint-disable-next-line no-console
      console.log("User already subscribed, continuing");
    }
    _.times(postNotifications, () => createDummyPost(randomUser))
  }
  if (commentNotifications > 0) {
    const post = Posts.findOne(); // Grab random post
    //eslint-disable-next-line no-console
    console.log("generating new comments...")
    try {
      performSubscriptionAction('subscribe', Posts, post._id, user)
    } catch(err) {
      //eslint-disable-next-line no-console
      console.log("User already subscribed, continuing");
    }
    _.times(commentNotifications, () => createDummyComment(randomUser, {postId: post._id}));

  }
  if (replyNotifications > 0) {
    const post = Posts.findOne();
    //eslint-disable-next-line no-console
    console.log("generating new replies...")
    try {
      performSubscriptionAction('subscribe', Users, randomUser._id, user);
    } catch(err) {
      //eslint-disable-next-line no-console
      console.log("User already subscribed, continuing");
    }
    const comment = createDummyComment(user, {postId: post._id});
    _.times(replyNotifications, () => createDummyComment(randomUser, {postId: post._id, parentCommentId: comment._id}));
  }
}
