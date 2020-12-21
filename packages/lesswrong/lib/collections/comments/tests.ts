import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from '../../../server/vulcan-lib';
import { createDummyUser, createDummyPost, createDummyComment, userUpdateFieldFails, userUpdateFieldSucceeds, catchGraphQLErrors, assertIsPermissionsFlavoredError } from '../../../testing/utils'

const { assert } = chai
chai.should();
chai.use(chaiAsPromised);


describe('createComment – ', async function() {
  this.timeout(10000)
  it('should return data if a user is provided', async function() {
    const user = await createDummyUser()
    const post = await createDummyPost()
    const query = `
      mutation {
        createComment(
          data: {
            contents: { originalContents: { type: "markdown", data: "test" } }
            postId: "${post._id}"
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
    const response = runQuery(query, {}, {currentUser: user})
    const expectedOutput = { data: { createComment: { data : {contents: {markdown: "test" } } } } }
    return (response as any).should.eventually.deep.equal(expectedOutput);
  });
});
describe('updateComment – ', async () => {
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
            originalContents
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
            originalContents
          }
        `
      }
    )
  });
});

describe('attempts to read hideKarma comment', async () => {
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
