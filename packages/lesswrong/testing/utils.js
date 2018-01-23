import { runQuery, newMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum'
import { Random } from 'meteor/random';

export const createDummyUser = async (username) => {
  const queryUsername = username || Random.id()
  const query = `
    mutation  {
      usersNew(document:{
        username:"${queryUsername}",
        email:"${queryUsername + "@test.lesswrong.com"}",
      }) {
        _id
        username
        email
      }
    }
  `;
  return (await runQuery(query)).data.usersNew;
}

export const dummyPostTitle = "Test Title";
export const dummyPostBody = "Test Body";

export const createDummyPost = async (userId, title=dummyPostTitle, body=dummyPostBody) => {
  const query = `
    mutation  {
      PostsNew(document:{
        title:"${title}",
        body:"${body}"
      }) {
        _id
        userId
        title
        htmlBody
      }
    }
  `;
  return (await runQuery(query,{},{currentUser:{_id:userId}})).data.PostsNew;
}

export const createDummyPostServer = async (user, data) => {
  const defaultData = {
    userId: user._id,
    title: dummyPostTitle,
    baseScore: 3,
    score: 0,
  }
  const postData = {...defaultData, ...data};
  console.log("CreateDummyPostServer postData: ", postData);
  return await newMutation({
    collection: Posts,
    document: postData,
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
