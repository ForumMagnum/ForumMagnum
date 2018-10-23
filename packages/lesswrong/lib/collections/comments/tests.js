import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';
import { createDummyUser, createDummyPost, createDummyComment, userUpdateFieldFails, userUpdateFieldSucceeds } from '../../../testing/utils.js'


chai.should();
chai.use(chaiAsPromised);


describe('createComment – ', async function() {
  this.timeout(10000)
  it('should return data if a user is provided', async function() {
    const user = await createDummyUser()
    const query = `
      mutation {
        createComment(data:{body: "test"}){
          data {
            body
          }
        }
      }
    `;
    const response = runQuery(query, {}, {currentUser: user})
    const expectedOutput = { data: { createComment: { data : {body: "test" } } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
});
describe('updateComment – ', async () => {
  it("fails when user updates another user's legacyParentId", async () => {
    const user = await createDummyUser()
    const otherUser = await createDummyUser()
    const post = await createDummyPost()
    const comment = await createDummyComment(otherUser, {postId: post._id})
    return userUpdateFieldFails({ user:user, document:comment, fieldName:'commentbody', collectionType: 'Comment'})
  });
  it("succeeds when user updates their own body", async () => {
    const user = await createDummyUser()
    const post = await createDummyPost()
    const comment = await createDummyComment(user, {postId: post._id})
    return userUpdateFieldSucceeds({ user:user, document:comment, fieldName:'legacyParentId', collectionType: 'Comment'})
  });
});
