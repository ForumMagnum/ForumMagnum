import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';

import {
  createDummyUser,
  createDummyPost,
  dummyPostTitle,
  dummyPostBody,
  clearDatabase
} from './utils.js'

import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum'

chai.should();
chai.use(chaiAsPromised);

describe('Utils', async () => {
  describe('createDummyUser', async () => {
    it('generates appropriate email', async () => {
      const user = await createDummyUser()
      user.email.should.equal(user.username + "@test.lesserwrong.com")
    });
    it('autogenerates username', async () => {
      const user = await createDummyUser()
      user.username.should.not.equal(undefined)
    });
    it("user is in no groups by default", async () => {
      const user = await createDummyUser()
      Object.keys(user).should.not.include('groups')
    });
    it("user can be added to a group", async () => {
      const testGroups = ['randomGroupName']
      const user = await createDummyUser({groups:testGroups})
      user.groups.should.deep.equal(testGroups)
    });
  });
  describe('createDummyPost', async () => {
    it('generates a default title and slug', async () => {
      const post = await createDummyPost()
      post.title.toLowerCase().should.equal(post.slug)
    });
  });

  describe('clearDatabase', async () => {
    it('clears database', async () => {
      await clearDatabase()
      const user = await createDummyUser()
      await createDummyPost(user._id)
      Posts.find().fetch().length.should.equal(1)
      Users.find().fetch().length.should.equal(1)
      await clearDatabase()
      Posts.find().fetch().length.should.equal(0)
      Users.find().fetch().length.should.equal(0)
    });
  });
})
