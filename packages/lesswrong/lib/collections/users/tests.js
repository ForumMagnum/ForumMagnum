import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, testUserCanUpdateField, testUserCannotUpdateField } from '../../../testing/utils.js'

chai.should();
chai.use(chaiAsPromised);

describe('updateUser – ', async () => {
  it("fails when user updates their displayName", async () => {
    const user = await createDummyUser()
    return testUserCannotUpdateField(user, user, 'displayName')
  });
  it("fails when user updates their createdAt", async () => {
    const user = await createDummyUser()
    return testUserCannotUpdateField(user, user, 'createdAt')
  });
  it("fails when sunshineUser updates a user's createdAt", async () => {
    const sunshineUser = await createDummyUser({groups:['sunshineRegiment']})
    const user = await createDummyUser()
    return testUserCannotUpdateField(sunshineUser, user, 'createdAt')
  });
})

describe('updateUser succeeds – ', async () => {
  it("succeeds when sunshineRegiment user updates their displayName", async () => {
    const user = await createDummyUser({groups:['sunshineRegiment']})
    return testUserCanUpdateField(user, user, 'displayName', 'User')
  });
  it("succeeds when user updates their bio", async () => {
    const user = await createDummyUser()
    return testUserCanUpdateField(user, user, 'bio', 'User')
  });
  it("succeeds when user updates their commentSorting", async () => {
    const user = await createDummyUser()
    return testUserCanUpdateField(user, user, 'commentSorting', 'User')
  });
})
