import React from 'react';
import { chai, expect } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';
import { getFragmentText } from 'meteor/vulcan:lib';
import { createDummyUser, createDummyPost } from '../../../testing/utils.js'
import { Posts, Comments } from "meteor/example-forum";

chai.should();
chai.use(chaiAsPromised);

describe('PostsEdit', async () => {
  it("succeeds when owner of post edits title", async () => {
    const user = await createDummyUser()
    const post = await createDummyPost(user)

    const newTitle = "New Test Title"

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{title:"${newTitle}"}) {
          title
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    const expectedOutput = { data: { PostsEdit: { title: `${newTitle}` } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
  it("fails when non-owner edits title", async () => {
    const user = await createDummyUser()
    const user2 = await createDummyUser()
    const post = await createDummyPost(user)

    const newTitle = "New Test Title"

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{title:"${newTitle}"}) {
          title
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:{_id:user2._id}})
    const expectedError = '{"id":"app.operation_not_allowed","value":"check"}'
    return response.should.be.rejectedWith(expectedError);
  });
});

describe('Posts.maxBaseScore', async () => {
  it("initializes at the original voting power of the author", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user);
    const updatedPost = await Posts.find({_id: post._id}).fetch();
    updatedPost[0].maxBaseScore.should.be.equal(1)
  });
})

describe('Posts RSS Views', async () => {
  it("only shows curated posts in curated-rss view", async () => {
    const user = await createDummyUser();
    const frontpagePost1 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost2 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost3 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const curatedPost1 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const curatedPost2 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const curatedPost3 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});

    const query = `
      query {
        PostsList(terms: {view: "curated-rss"}) {
          _id
        }
      }
    `;

    const { data: { PostsList } } = await runQuery(query,{},user)
    _.pluck(PostsList, '_id').should.not.include(frontpagePost1._id)
    _.pluck(PostsList, '_id').should.not.include(frontpagePost2._id)
    _.pluck(PostsList, '_id').should.not.include(frontpagePost3._id)
    _.pluck(PostsList, '_id').should.include(curatedPost1._id)
    _.pluck(PostsList, '_id').should.include(curatedPost2._id)
    _.pluck(PostsList, '_id').should.include(curatedPost3._id)
  });it("returns curated posts in descending order of them being curated", async () => {
    const user = await createDummyUser();
    const now = new Date();
    const yesterday = new Date().getTime()-(1*24*60*60*1000);
    const twoDaysAgo = new Date().getTime()-(2*24*60*60*1000);
    const curatedPost1 = await createDummyPost(user, {curatedDate: now, frontpageDate: new Date(), baseScore: 10});
    const curatedPost2 = await createDummyPost(user, {curatedDate: yesterday, frontpageDate: new Date(), baseScore: 10});
    const curatedPost3 = await createDummyPost(user, {curatedDate: twoDaysAgo, frontpageDate: new Date(), baseScore: 10});

    const query = `
      query {
        PostsList(terms: {view: "curated-rss"}) {
          _id
        }
      }
    `;

    const { data: { PostsList } } = await runQuery(query,{},user)
    const idList = _.pluck(PostsList, '_id');
    idList.indexOf(curatedPost1._id).should.be.below(idList.indexOf(curatedPost2._id));
    idList.indexOf(curatedPost2._id).should.be.below(idList.indexOf(curatedPost3._id));
  });
  it("only shows frontpage posts in frontpage-rss view", async () => {
    const user = await createDummyUser();
    const frontpagePost1 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const frontpagePost2 = await createDummyPost(user, {curatedDate: new Date(), frontpageDate: new Date(), baseScore: 10});
    const frontpagePost3 = await createDummyPost(user, {frontpageDate: new Date(), baseScore: 10});
    const personalPost1 = await createDummyPost(user, {baseScore: 10});
    const personalPost2 = await createDummyPost(user, {baseScore: 10});
    const personalPost3 = await createDummyPost(user, {baseScore: 10});

    const query = `
      query {
        PostsList(terms: {view: "frontpage-rss"}) {
          _id
        }
      }
    `;

    const { data: { PostsList } } = await runQuery(query,{},user)
    _.pluck(PostsList, '_id').should.include(frontpagePost1._id)
    _.pluck(PostsList, '_id').should.include(frontpagePost2._id)
    _.pluck(PostsList, '_id').should.include(frontpagePost3._id)
    _.pluck(PostsList, '_id').should.not.include(personalPost1._id)
    _.pluck(PostsList, '_id').should.not.include(personalPost2._id)
    _.pluck(PostsList, '_id').should.not.include(personalPost3._id)
  });
})
