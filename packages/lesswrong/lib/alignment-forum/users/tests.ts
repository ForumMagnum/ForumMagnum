import { testStartup } from '../../../testing/testMain';
import { createDummyUser, userUpdateFieldSucceeds, userUpdateFieldFails, catchGraphQLErrors, assertIsPermissionsFlavoredError } from '../../../testing/utils'

testStartup();

describe('alignment updateUser – ', () => {
  let graphQLerrors = catchGraphQLErrors(beforeEach, afterEach);
  it("fails when alignmentForumAdmin updates another user's bio", async () => {
    const user = await createDummyUser()
    const alignmentAdmin = await createDummyUser({groups:['alignmentForumAdmins']})
    await userUpdateFieldFails({
      user:alignmentAdmin,
      document:user,
      fieldName:'bio',
      collectionType:'User'
    })
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
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
    await userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'reviewForAlignmentForumUserId',
      collectionType:'User'
    })
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
})
