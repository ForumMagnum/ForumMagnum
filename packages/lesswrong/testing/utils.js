import { runQuery, newMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum'
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
