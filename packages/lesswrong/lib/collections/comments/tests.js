import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';
import { createDummyUser } from '../../../testing/utils.js'


chai.should();
chai.use(chaiAsPromised);


describe('CommentsNew', async function() {
  this.timeout(10000)
  it('should return data if a user is provided', async function() {
    const user = await createDummyUser()
    const query = `
      mutation CommentsNew {
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
