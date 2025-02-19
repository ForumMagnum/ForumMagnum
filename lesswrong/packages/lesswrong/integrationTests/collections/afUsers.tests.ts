import "../integrationTestSetup";
import {
  createDummyUser,
  userUpdateFieldSucceeds,
  userUpdateFieldFails,
  catchGraphQLErrors,
  assertIsPermissionsFlavoredError,
} from '../utils';

describe('alignment updateUser – ', () => {
  let graphQLerrors = catchGraphQLErrors(beforeEach, afterEach);
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
    await userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'reviewForAlignmentForumUserId',
      collectionType:'User'
    })
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
})
