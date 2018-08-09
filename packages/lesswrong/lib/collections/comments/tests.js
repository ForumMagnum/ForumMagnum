import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';
import { createDummyUser } from '../../../testing/utils.js'


chai.should();
chai.use(chaiAsPromised);


describe('CommentsNew', async () => {
  it('should return data if a user is provided', async () => {
    const user = await createDummyUser()
    const query = `
      mutation CommentsNew {
        CommentsNew(document:{body: "test"}){
          body
        }
      }
    `;
    const response = runQuery(query, {}, {currentUser: user})
    const expectedOutput = { data: { CommentsNew: { body: "test" } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
});
