import "../integrationTestSetup";
import { runQuery } from '../../server/vulcan-lib/query';
import { createDummyUser, createDummyPost, catchGraphQLErrors, assertIsPermissionsFlavoredError, withNoLogs } from '../utils'

const suggestForAlignmentQuery = (postId: string) => `
  mutation {
    setPostSuggestedForAlignment(postId: "${postId}", suggested: true) {
      suggestForAlignmentUserIds
    }
  }
`;

const reviewForAlignmentQuery = (postId: string) => `
  mutation {
    reviewPostForAlignment(postId: "${postId}", approved: false) {
      reviewForAlignmentUserId
    }
  }
`;

describe('AlignmentForum post suggestions', () => {
  let graphQLerrors = catchGraphQLErrors();

  it("succeeds when alignmentForum user suggests a post for alignment", async () => {
    const user = await createDummyUser({groups:['alignmentForum']})
    const post = await createDummyPost()

    const response = runQuery(suggestForAlignmentQuery(post._id),{},{currentUser:user})
    const expectedOutput = { data: { setPostSuggestedForAlignment: { suggestForAlignmentUserIds: [user._id] } } }
    return (response as any).should.eventually.deep.equal(expectedOutput);
  });
  it("succeeds when alignmentForumAdmin suggests a post for alignment", async () => {
    const user = await createDummyUser({groups:['alignmentForumAdmins']})
    const post = await createDummyPost()

    const response = runQuery(suggestForAlignmentQuery(post._id),{},{currentUser:user})
    const expectedOutput = { data: { setPostSuggestedForAlignment: { suggestForAlignmentUserIds: [user._id] } } }
    return (response as any).should.eventually.deep.equal(expectedOutput);
  });
  it("fails when alignmentForum user reviews a post for alignment", async () => {
    const user = await createDummyUser({groups:['alignmentForum']})
    const post = await createDummyPost()

    await withNoLogs(async () => {
      const response = runQuery(reviewForAlignmentQuery(post._id),{},{currentUser:user})
      await (response as any).should.be.rejected;
    });
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
  it("succeeds when alignmentForumAdmin reviews a post for alignment", async () => {
    const user = await createDummyUser({groups:['alignmentForumAdmins']})
    const post = await createDummyPost()

    const response = runQuery(reviewForAlignmentQuery(post._id),{},{currentUser:user})
    const expectedOutput = { data: { reviewPostForAlignment: { reviewForAlignmentUserId: user._id } } }
    return (response as any).should.eventually.deep.equal(expectedOutput);
  });
})
