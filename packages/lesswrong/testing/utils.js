import { runQuery, newMutation, removeCallback, addCallback } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum'
import Conversations from '../lib/collections/conversations/collection.js';
import Messages from '../lib/collections/messages/collection.js';
import {Editor, ContentState, convertToRaw} from 'draft-js';
import { Random } from 'meteor/random';

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
  const defaultData = {
    userId: user ? user._id : createDefaultUser()._id,
    title: Random.id(),
  }
  const postData = {...defaultData, ...data};
  return await newMutation({
    collection: Posts,
    document: postData,
    currentUser: user,
    validate: false,
    context: {},
  });
}

export const createDummyUser = async (data) => {
  const testUsername = Random.id()
  const defaultData = {
    username: testUsername,
    email: testUsername + "@test.lesserwrong.com"
  }
  const userData = {...defaultData, ...data};
  return await newMutation({
    collection: Users,
    document: userData,
    validate: false,
    context: {},
  });
}
export const createDummyComment = async (user, data) => {
  let defaultData = {
    userId: user._id,
    body: "This is a test comment",
  }
  if (!data.postId) {
    defaultData.postId = Posts.findOne()._id; // By default, just grab ID from a random post
  }
  const commentData = {...defaultData, ...data};
  return await newMutation({
    collection: Comments,
    document: commentData,
    currentUser: user,
    validate: false,
    context: {},
  });
}

export const createDummyConversation = async (user, data) => {
  let defaultData = {
    title: user.displayName,
    participantIds: [user._id],
  }
  const conversationData = {...defaultData, ...data};
  return await newMutation({
    collection: Conversations,
    document: conversationData,
    currentUser: user,
    validate: false,
    context: {},
  });
}

export const createDummyMessage = async (user, data) => {
  let defaultData = {
    content: convertToRaw(ContentState.createFromText('Dummy Message Content')),
    userId: user._id,
  }
  const messageData = {...defaultData, ...data};
  return await newMutation({
    collection: Messages,
    document: messageData,
    currentUser: user,
    validate: false,
    context: {},
  });
}

export const clearDatabase = async () => {
  Users.find().fetch().forEach((i)=>{
    Users.remove(i._id)
  })
  Posts.find().fetch().forEach((i)=>{
    Posts.remove(i._id)
  })
  Comments.find().fetch().forEach((i)=>{
    Posts.remove(i._id)
  })
}

export function addTestToCallbackOnce(callbackHook, test, done) {
  if (!done) {
    throw new Error('Need to provide `done()` function to test callback');
  }
  const callbackFunctionName = test.name + "testCallbackOnceInside"
  const testCallback = async function(...args) {
    removeCallback(callbackHook, callbackFunctionName)
    try {
      await test(...args)
    } catch(err) {
      done(err)
      return;
    }
    done()
  }
  Object.defineProperty(testCallback, "name", { value: callbackFunctionName });
  addCallback(callbackHook, testCallback);
}
