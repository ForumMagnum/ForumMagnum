import { newMutation, runQuery } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Posts } from '../lib/collections/posts'
import { Comments } from '../lib/collections/comments'
import Conversations from '../lib/collections/conversations/collection.js';
import Messages from '../lib/collections/messages/collection.js';
import {ContentState, convertToRaw} from 'draft-js';
import { Random } from 'meteor/random';
import { setOnGraphQLError } from 'meteor/vulcan:lib';

export const createDefaultUser = async() => {
  // Creates defaultUser if they don't already exist
  const defaultUser = Users.findOne({username:"defaultUser"})
  if (!defaultUser) {
    return createDummyUser({username:"defaultUser"})
  } else {
    return defaultUser
  }
}

export const createDummyPost = async (user, data) => {
  const defaultUser = await createDefaultUser();
  const defaultData = {
    userId: (user && user._id) ? user._id : defaultUser._id,
    title: Random.id(),
  }
  const postData = {...defaultData, ...data};
  const newPostResponse = await newMutation({
    collection: Posts,
    document: postData,
    currentUser: user || defaultUser,
    validate: false,
    context: {},
  });
  return newPostResponse.data
}

export const createDummyUser = async (data) => {
  const testUsername = Random.id()
  const defaultData = {
    username: testUsername,
    email: testUsername + "@test.lesserwrong.com",
    reviewedByUserId: "fakeuserid" // TODO: make this user_id correspond to something real that would hold up if we had proper validation
  }
  const userData = {...defaultData, ...data};
  const newUserResponse = await newMutation({
    collection: Users,
    document: userData,
    validate: false,
    context: {},
  })
  return newUserResponse.data;
}
export const createDummyComment = async (user, data) => {
  const defaultUser = await createDefaultUser();
  let defaultData = {
    userId: (user || defaultUser)._id,
    contents: {
      originalContents: {
        type: "markdown",
        data: "This is a test comment"
      }
    },
  }
  if (!data.postId) {
    defaultData.postId = Posts.findOne()._id; // By default, just grab ID from a random post
  }
  const commentData = {...defaultData, ...data};
  const newCommentResponse = await newMutation({
    collection: Comments,
    document: commentData,
    currentUser: user || defaultUser,
    validate: false,
    context: {},
  });
  return newCommentResponse.data
}

export const createDummyConversation = async (user, data) => {
  let defaultData = {
    title: user.displayName,
    participantIds: [user._id],
  }
  const conversationData = {...defaultData, ...data};
  const newConversationResponse = await newMutation({
    collection: Conversations,
    document: conversationData,
    currentUser: user,
    validate: false,
    context: {},
  });
  return newConversationResponse.data
}

export const createDummyMessage = async (user, data) => {
  let defaultData = {
    contents: convertToRaw(ContentState.createFromText('Dummy Message Content')),
    userId: user._id,
  }
  const messageData = {...defaultData, ...data};
  const newMessageResponse = await newMutation({
    collection: Messages,
    document: messageData,
    currentUser: user,
    validate: false,
    context: {},
  });
  return newMessageResponse.data
}