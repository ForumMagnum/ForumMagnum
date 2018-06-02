import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';

import {
  createDummyUser,
  createDummyPost,
} from './utils.js'

chai.should();
chai.use(chaiAsPromised);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Utils', async () => {
  before(async function(done) {
    this.timeout(20000)
    let vulcanLoaded = false;
    //eslint-disable-next-line no-console
    console.log("Holding off tests until startup")
    while (!vulcanLoaded) {
      await sleep(1000)
      try {
        let user = await createDummyUser();
        //eslint-disable-next-line no-console
        console.log("Holding off tests until startup", user)
        if(user._id) {
          vulcanLoaded = true;
        }
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
