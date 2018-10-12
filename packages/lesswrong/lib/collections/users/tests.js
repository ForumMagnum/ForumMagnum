import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, userUpdateFieldSucceeds, userUpdateFieldFails } from '../../../testing/utils.js'

chai.should();
chai.use(chaiAsPromised);

describe('updateUser – ', async () => {
  it("fails when user updates their displayName", async () => {
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'displayName'
    })
  });
  it("fails when user updates their createdAt", async () => {
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'createdAt'
    })
  });
  it("fails when sunshineUser updates a user's createdAt", async () => {
    const sunshineUser = await createDummyUser({groups:['sunshineRegiment']})
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:sunshineUser,
      document:user,
      fieldName:'createdAt'
    })
  });
  it("fails when user updates their nullifyVotes", async () => {
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'nullifyVotes'
    })
  });
  it("fails when user updates their voteBanned", async () => {
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'voteBanned',
      newValue: true,
    })
  });
  it("fails when user updates their deleteContent", async () => {
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'deleteContent',
      newValue: true,
    })
  });
  it("fails when user updates their banned", async () => {
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'banned',
      newValue: true,
    })
  });
})

describe('updateUser succeeds – ', async () => {
  it("succeeds when user updates their bio", async () => {
    const user = await createDummyUser()
    return userUpdateFieldSucceeds({
      user: user,
      document: user,
      fieldName: 'bio',
      collectionType: 'User',
    })
  });
  it("succeeds when sunshineRegiment user updates their displayName", async () => {
    const user = await createDummyUser({groups:['sunshineRegiment']})
    return userUpdateFieldSucceeds({
      user: user,
      document: user,
      fieldName: 'displayName',
      collectionType: 'User',
    })
  });
  it("succeeds when sunshineRegiment user updates their nullifyVotes", async () => {
    const user = await createDummyUser({groups:['sunshineRegiment']})
    return userUpdateFieldSucceeds({
      user:user,
      document:user,
      fieldName:'nullifyVotes',
      collectionType:'User',
      newValue: true,
    })
  });
  it("succeeds when user updates their voteBanned", async () => {
    const user = await createDummyUser({groups:['sunshineRegiment']})
    return userUpdateFieldSucceeds({
      user:user,
      document:user,
      fieldName:'voteBanned',
      collectionType:'User',
      newValue: true,
    })
  });
  it("succeeds when user updates their deleteContent", async () => {
    const user = await createDummyUser({groups:['sunshineRegiment']})
    return userUpdateFieldSucceeds({
      user:user,
      document:user,
      fieldName:'deleteContent',
      collectionType:'User',
      newValue: true,
    })
  });
})
