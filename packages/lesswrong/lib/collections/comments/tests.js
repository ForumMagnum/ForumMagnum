import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';
import { createDummyUser, createDummyPost, createDummyComment, userUpdateFieldFails, userUpdateFieldSucceeds, catchGraphQLErrors, assertIsPermissionsFlavoredError } from '../../../testing/utils.js'


chai.should();
chai.use(chaiAsPromised);


describe('createComment – ', async function() {
  this.timeout(10000)
  it('should return data if a user is provided', async function() {
    const user = await createDummyUser()
    const query = `
      mutation {
        createComment(data:{ contents: { originalContents: { type: "markdown", data: "test" } } }){
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
    return response.should.eventually.deep.equal(expectedOutput);
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
