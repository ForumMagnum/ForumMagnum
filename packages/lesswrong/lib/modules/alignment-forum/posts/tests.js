import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai';
import chaiAsPromised from 'chai-as-promised';
import { runQuery } from 'meteor/vulcan:core';
import { createDummyUser, createDummyPost } from '../../../../testing/utils.js'

chai.should();
chai.use(chaiAsPromised);

describe('AlignmentForum PostsEdit', async () => {
  it("fails when an alignmentForum user edits a post title", async () => {
    const user = await createDummyUser({groups:['alignmentForum']})
    const post = await createDummyPost()

    const newTitle = "New Test Title"

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{title:"${newTitle}"}) {
          title
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    return response.should.be.rejected;
  });
  it("fails when an alignmentForum user edits a post's content field", async () => {
    const user = await createDummyUser({groups:['alignmentForum']})
    const post = await createDummyPost()

    const newContent = "New Test Title"

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{content:"${newContent}"}) {
          title
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    return response.should.be.rejected;
  });
  it("succeeds when alignmentForum user edits the suggestForAlignmentUserIds field", async () => {
    const user = await createDummyUser({groups:['alignmentForum']})
    const post = await createDummyPost()

    const userIds = user._id

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{suggestForAlignmentUserIds:["${userIds}"]}) {
          suggestForAlignmentUserIds
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    const expectedOutput = { data: { PostsEdit: { suggestForAlignmentUserIds: [`${userIds}`] } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
  it("succeeds when alignmentForumAdmin edits the suggestForAlignmentUserIds field", async () => {
    const user = await createDummyUser({groups:['alignmentForumAdmins']})
    const post = await createDummyPost()

    const userIds = user._id

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{suggestForAlignmentUserIds:["${userIds}"]}) {
          suggestForAlignmentUserIds
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    const expectedOutput = { data: { PostsEdit: { suggestForAlignmentUserIds: [`${userIds}`] } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
  it("fails when alignmentForum user edits the reviewForAlignmentUserId field", async () => {
    const user = await createDummyUser({groups:['alignmentForum']})
    const post = await createDummyPost()

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{reviewForAlignmentUserId:"${user._id}"}) {
          reviewForAlignmentUserId
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    return response.should.be.rejected;
  });
  it("succeeds when alignmentForumAdmin edits the reviewForAlignmentUserId field", async () => {
    const user = await createDummyUser({groups:['alignmentForumAdmins']})
    const post = await createDummyPost()

    const query = `
      mutation  {
        PostsEdit(documentId:"${post._id}",set:{reviewForAlignmentUserId:"${user._id}"}) {
          reviewForAlignmentUserId
        }
      }
    `;
    const response = runQuery(query,{},{currentUser:user})
    const expectedOutput = { data: { PostsEdit: { reviewForAlignmentUserId: `${user._id}` } } }
    return response.should.eventually.deep.equal(expectedOutput);
  });
})
