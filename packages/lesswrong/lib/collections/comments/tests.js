import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';

chai.should();
chai.use(chaiAsPromised);


describe('CommentsNew', async () => {
  it('should throw error if a user is not included', async () => {

    const query = `
      mutation CommentsNew {
        CommentsNew(document:{content:{}}){
          body
        }
      }
    `;
    const response = runQuery(query, {}, {currentUser:undefined})
    const expectedError = '{"id":"app.operation_not_allowed","value":"check"}'

    return response.should.be.rejectedWith(expectedError);
  });
  it('should return data if a user is provided', async () => {
    const query = `
      mutation CommentsNew {
        CommentsNew(document:{content:{}}){
          body
        }
      }
    `;
    const response = runQuery(query, {})
    const expectedOutput = { data: { CommentsNew: { body: null } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
});
