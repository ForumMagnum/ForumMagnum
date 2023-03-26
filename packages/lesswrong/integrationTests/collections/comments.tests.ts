import "../integrationTestSetup";
import chai from 'chai';
import { runQuery } from '../../server/vulcan-lib';
import {
  createDummyUser,
  createDummyPost,
  createDummyComment,
  userUpdateFieldFails,
  userUpdateFieldSucceeds,
  catchGraphQLErrors,
  assertIsPermissionsFlavoredError,
  withNoLogs,
} from '../utils';
import moment from 'moment';

const { assert } = chai;

function createCommentQuery(postId: string) {
  return `
    mutation {
      createComment(
        data: {
          contents: { originalContents: { type: "markdown", data: "test" } }
          postId: "${postId}"
        }
      ){
        data {
          contents {
            markdown
          }
        }
      }
    }
  `;
}

describe('createComment – ', function() {
  it('should return data if a user is provided', async function() {
    const user = await createDummyUser()
    const post = await createDummyPost()
    const response = runQuery(createCommentQuery(post._id), {}, {currentUser: user})
    const expectedOutput = { data: { createComment: { data : {contents: {markdown: "test" } } } } }
    return (response as any).should.eventually.deep.equal(expectedOutput);
  });
  
  it('should fail if the user is banned', async function () {
    const user = await createDummyUser()
    const post = await createDummyPost()
    await withNoLogs(async () => {
      const queryPromise = runQuery(
        createCommentQuery(post._id),
        {},
        {currentUser: {...user, banned: moment().add(1, 'year').toDate()}}
      )
      await (queryPromise as any).should.be.rejected
    });
  })
});
describe('updateComment – ', () => {
  let graphQLerrors = catchGraphQLErrors(beforeEach, afterEach);
  it("fails when user updates another user's body", async () => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const post = await createDummyPost()
    const comment = await createDummyComment(otherUser, {postId: post._id})
    await userUpdateFieldFails(
      { 
        user:user, 
        document:comment, 
        fieldName:'contents', 
        collectionType: 'Comment', 
        newValue: {originalContents: {type: "markdown", data: "stuff"}},
        fragment: `
          contents {
            originalContents {
              type
              data
            }
          }
        `
      }
    )
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
  it("succeeds when user updates their own body", async () => {
    const user = await createDummyUser()
    const post = await createDummyPost()
    const comment = await createDummyComment(user, {postId: post._id})
    await userUpdateFieldSucceeds(
      { 
        user:user, 
        document:comment, 
        fieldName:'contents', 
        collectionType: 'Comment', 
        newValue: {originalContents: {type: "markdown", data: "stuff"}},
        fragment: `
          contents {
            originalContents {
              type
              data
            }
          }
        `
      }
    )
  });
});

describe('attempts to read hideKarma comment', () => {
  const query = `
    query ($id: String) {
      comment(input: {selector: {_id: $id}}) {
        result {
          _id
          hideKarma
          baseScore
        }
      }
    }
  `

  it('regular user cannot find hidden karma', async () => {
    const user = await createDummyUser()
    const post = await createDummyPost(null, {hideCommentKarma: true})
    const comment = await createDummyComment(null, {postId: post._id})

    const result = await runQuery(query, {id: comment._id}, {currentUser: user})
    const receivedComment = result?.data?.comment?.result
    if (!receivedComment) {
      assert.fail('Expected query to return comment')
      return
    }
    receivedComment._id.should.equal(comment._id)
    receivedComment.hideKarma.should.equal(true)
    const baseScoreMissing = receivedComment.baseScore === null || receivedComment.baseScore === undefined;
    (baseScoreMissing as any).should.equal(true);
  })

  it('regular user can find karma for normal posts', async () => {
    const user = await createDummyUser()
    const post = await createDummyPost(null)
    const comment = await createDummyComment(null, {postId: post._id})

    const result = await runQuery(query, {id: comment._id}, {currentUser: user})
    const receivedComment = result?.data?.comment?.result
    if (!receivedComment) {
      assert.fail('Expected query to return comment')
      return
    }
    receivedComment._id.should.equal(comment._id)
    receivedComment.hideKarma.should.equal(false)
    receivedComment.baseScore.should.equal(1)
  })

  it('admin user can find hidden karma', async () => {
    const user = await createDummyUser({isAdmin: true})
    const post = await createDummyPost(null, {hideCommentKarma: true})
    const comment = await createDummyComment(null, {postId: post._id})

    const result = await runQuery(query, {id: comment._id}, {currentUser: user})
    const receivedComment = result?.data?.comment?.result
    if (!receivedComment) {
      assert.fail('Expected query to return comment')
      return
    }
    receivedComment._id.should.equal(comment._id)
    receivedComment.hideKarma.should.equal(true)
    receivedComment.baseScore.should.equal(1)
  })
})
