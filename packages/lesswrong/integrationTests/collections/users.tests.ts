import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import "../integrationTestSetup";
import {
  createDummyUser,
  userUpdateFieldSucceeds,
  userUpdateFieldFails,
  catchGraphQLErrors,
  assertIsPermissionsFlavoredError,
  withNoLogs,
  waitUntilPgQueriesFinished,
} from '../utils';
import Users from "@/server/collections/users/collection";

describe('updateUser – ', () => {
  let graphQLerrors = catchGraphQLErrors(beforeEach, afterEach);
  it("fails when user updates their displayName more than once", async () => {
    const user = await createDummyUser()
    // Should succeed the first time
    await userUpdateFieldSucceeds({
      user:user,
      document:user,
      fieldName:'displayName',
      collectionType:'User',
    })
    await waitUntilPgQueriesFinished();
    // Clear the loader cache to prevent the user created with no display name from allowing the second display name update to go through.
    // (In production that's not a problem because no user is going to cause two updates against a displayName within a single request,
    // without hitting the /graphql api directly, and if they do that idc.)
    createAnonymousContext().loaders.Users.clearAll();
    // Also fetch the updated user, otherwise we'll end up priming the loader cache with the currentUser
    // passed into `runQuery` inside of `userUpdateFieldFails`.
    const updatedUser = await Users.findOne(user._id);
    // Should hit the rate limit the second time
    await userUpdateFieldFails({
      user:updatedUser,
      document:updatedUser,
      fieldName:'displayName',
      collectionType:'User',
    })
    graphQLerrors.getErrors(); // Ignore the details of the error
  });
  it("fails when user updates their createdAt", async () => {
    const user = await createDummyUser()
    await userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'createdAt',
      collectionType:'User',
      newValue: new Date(),
    })
    // FIXME: This gives an "Unknown field" error instead of a permissions error
    graphQLerrors.getErrors(); // Ignore the wrong-type error
    //assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
  it("fails when sunshineUser updates a user's createdAt", async () => {
    const sunshineUser = await createDummyUser({groups:['sunshineRegiment']})
    const user = await createDummyUser()
    await userUpdateFieldFails({
      user:sunshineUser,
      document:user,
      fieldName:'createdAt',
      collectionType:'User',
      newValue: new Date(),
    })
    // FIXME: This gives an "Unknown field" error instead of a permissions error
    graphQLerrors.getErrors(); // Ignore the wrong-type error
    //assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
  it("fails when user updates their nullifyVotes", async () => {
    const user = await createDummyUser()
    await userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'nullifyVotes',
      collectionType:'User',
      newValue: false,
    })
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
  it("fails when user updates their deleteContent", async () => {
    const user = await createDummyUser()
    await userUpdateFieldFails({
      user:user,
      document:user,
      fieldName:'deleteContent',
      newValue: true,
      collectionType:'User',
    })
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
  it("fails when user updates their banned", async () => {
    const user = await createDummyUser()
    await userUpdateFieldFails({
      user:user,
      document:user,
      fieldName: 'banned',
      newValue: new Date(),
      collectionType:'User',
    })
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
})

describe('updateUser succeeds – ', () => {
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
    await withNoLogs(async () => {
      await userUpdateFieldSucceeds({
        user:user,
        document:user,
        fieldName:'nullifyVotes',
        collectionType:'User',
        newValue: true,
      });
    });
  });
  it("succeeds when user updates their deleteContent", async () => {
    const user = await createDummyUser({groups:['sunshineRegiment']})
    await withNoLogs(async () => {
      await userUpdateFieldSucceeds({
        user:user,
        document:user,
        fieldName:'deleteContent',
        collectionType:'User',
        newValue: true,
      })
    });
  });
})
