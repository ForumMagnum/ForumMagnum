import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, userUpdateFieldSucceeds, userUpdateFieldFails } from '../../../../testing/utils.js'

chai.should();
chai.use(chaiAsPromised);

describe('alignment updateUser – ', async () => {
  it("fails when alignmentForumAdmin updates another user's bio", async () => {
    const user = await createDummyUser()
    const alignmentAdmin = await createDummyUser({groups:['alignmentForumAdmins']})
    return userUpdateFieldFails({
      user:alignmentAdmin,
      document:user,
      fieldName:'bio'
    })
  });
  it("succeeds when alignmentForumAdmin updates user's reviewForAlignmentForumUserId", async () => {
    const user = await createDummyUser()
    const alignmentAdmin = await createDummyUser({groups:['alignmentForumAdmins']})
    return userUpdateFieldSucceeds({
      user:alignmentAdmin,
      document:user,
      fieldName:'reviewForAlignmentForumUserId',
      collectionType:'User'
    })
  });
  it("fails when user update's their reviewForAlignmentForumUserId", async () => {
    const user = await createDummyUser()
    return userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'reviewForAlignmentForumUserId',
      collectionType:'User'
    })
  });
})
