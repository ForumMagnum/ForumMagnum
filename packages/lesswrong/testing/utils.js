import { newMutation, removeCallback, addCallback } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Posts } from '../lib/collections/posts'
import { Comments } from '../lib/collections/comments'
import Conversations from '../lib/collections/conversations/collection.js';
import Messages from '../lib/collections/messages/collection.js';
import {ContentState, convertToRaw} from 'draft-js';
import { Random } from 'meteor/random';
import { runQuery } from 'meteor/vulcan:core';

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
    currentUser: user,
    validate: false,
    context: {},
  });
  return newPostResponse.data
}

export const createDummyUser = async (data) => {
  const testUsername = Random.id()
  const defaultData = {
    username: testUsername,
    email: testUsername + "@test.lesserwrong.com"
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
  let defaultData = {
    userId: user._id,
    body: "This is a test comment",
  }
  if (!data.postId) {
    defaultData.postId = Posts.findOne()._id; // By default, just grab ID from a random post
  }
  const commentData = {...defaultData, ...data};
  const newCommentResponse = await newMutation({
    collection: Comments,
    document: commentData,
    currentUser: user,
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
    content: convertToRaw(ContentState.createFromText('Dummy Message Content')),
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

export const userUpdateFieldFails = async ({user, document, fieldName, newValue}) => {
  if (!newValue) {
    newValue = Random.id()
  }

  const query = `
    mutation {
      updateUser(selector: {_id:"${user._id}"},data:{${fieldName}:"${newValue}"}) {
        data {
          ${fieldName}
        }
      }
    }
  `;
  const response = runQuery(query,{},{currentUser:user})
  return response.should.be.rejected;
}

export const userUpdateFieldSucceeds = async ({user, document, fieldName, collectionType, newValue}) => {

  let comparedValue = newValue

  if (!newValue) {
    comparedValue = Random.id()
    newValue = `"${comparedValue}"`
  }

  const query = ` 
      mutation {
        updateUser(selector: {_id:"${user._id}"},data:{${fieldName}:${newValue}}) {
          data {
            ${fieldName}
          }
        }
      }
    `;
  const response = runQuery(query,{},{currentUser:user})
  const expectedOutput = { data: { [`update${collectionType}`]: { data: { [fieldName]: comparedValue} }}}
  return response.should.eventually.deep.equal(expectedOutput);

}
