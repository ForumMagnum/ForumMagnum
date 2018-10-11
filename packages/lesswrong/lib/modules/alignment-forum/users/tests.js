import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { createDummyUser, testUserCanUpdateField, testUserCannotUpdateField } from '../../../../testing/utils.js'

chai.should();
chai.use(chaiAsPromised);

describe('alignment updateUser – ', async () => {
  it("fails when alignmentForumAdmin updates another user's bio", async () => {
    const user = await createDummyUser()
    const alignmentAdmin = await createDummyUser({groups:['alignmentForumAdmins']})
    return testUserCannotUpdateField(alignmentAdmin, user, 'bio')
  });
  it("succeeds when alignmentForumAdmin updates user's reviewForAlignmentFormUserId", async () => {
    const user = await createDummyUser()
    const alignmentAdmin = await createDummyUser({groups:['alignmentForumAdmins']})
    return testUserCanUpdateField(alignmentAdmin, user, 'reviewForAlignmentFormUserId', 'User')
  });
  it("fails when user update's their reviewForAlignmentFormUserId", async () => {
    const user = await createDummyUser()
    return testUserCannotUpdateField(user, user, 'reviewForAlignmentFormUserId', 'User')
  });
})
