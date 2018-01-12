import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';

import { createDummyUser, createDummyPost } from '../../../testing/utils.js'

import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum'

chai.should();
chai.use(chaiAsPromised);

describe('PostsEdit', async () => {
  it("succeeds when owner of post edits title", async () => {
    const user = await createDummyUser()
    const post = await createDummyPost(user._id)

    const newTitle = "New Test Title"

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{title:"${newTitle}"}) {
          title
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:{_id:user._id}})
    const expectedOutput = { data: { PostsEdit: { title: `${newTitle}` } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
  it("fails when non-owner edits title", async () => {
    const user = await createDummyUser()
    const user2 = await createDummyUser()
    const post = await createDummyPost(user._id)

    const newTitle = "New Test Title"

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{title:"${newTitle}"}) {
          title
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:{_id:user2._id}})
    const expectedError = '{"id":"app.operation_not_allowed","value":"check"}'
    return response.should.be.rejectedWith(expectedError);
  });
});
