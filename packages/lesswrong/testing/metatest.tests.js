import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { Posts } from 'meteor/example-forum';

import {
  createDummyUser,
  createDummyPost,
} from './utils.js'

chai.should();
chai.use(chaiAsPromised);

describe('Utils', async () => {
  before(async (done) => {
    let vulcanLoaded = false;
    //eslint-disable-next-line no-console
    console.log("Holding off tests until startup")
    while (!vulcanLoaded) {
      try {
        //eslint-disable-next-line no-console
        console.log("Holding off tests until startup")
        Posts.findOne()
        vulcanLoaded = true;
      } catch(e) {
        //eslint-disable-next-line no-console
        console.error(e)
      }
    }
    done()
  })
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

  // describe('clearDatabase', async () => {
  //   it('clears database', async () => {
  //     await clearDatabase()
  //     const user = await createDummyUser()
  //     await createDummyPost(user._id)
  //     Posts.find().fetch().length.should.equal(1)
  //     Users.find().fetch().length.should.equal(1)
  //     await clearDatabase()
  //     Posts.find().fetch().length.should.equal(0)
  //     Users.find().fetch().length.should.equal(0)
  //   });
  // });
})
