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
      user.email.should.equal(user.username + "@test.lesswrong.com")
    });
    it('autogenerates username', async () => {
      const user = await createDummyUser()
      user.username.should.not.equal(undefined)
    });
  });

  describe('createDummyPost', async () => {
    it('uses default title and htmlBody', async () => {
      const user = await createDummyUser()
      const post = await createDummyPost(user._id)
      post.title.should.equal(dummyPostTitle)
      post.htmlBody.should.contain(dummyPostBody)
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
