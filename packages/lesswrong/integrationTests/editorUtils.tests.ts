import "./integrationTestSetup";
import { createDummyPost, createDummyUser } from "./utils";
import Revisions from "../server/collections/revisions/collection";
import { Posts } from "../server/collections/posts/collection";
import { runQuery } from "../server/vulcan-lib/query";
import { syncDocumentWithLatestRevision } from "../server/editor/utils";
import { fetchFragmentSingle } from "../server/fetchFragment";
import { createAnonymousContext } from "../server/vulcan-lib/createContexts";
async function updatePost(user: DbUser, postId: string, newMarkup: string) {
  const query = `
    mutation PostsEdit {
      updatePost(
        selector: {_id:"${postId}"},
        data: {contents: {originalContents: {type: "ckEditorMarkup", data: "${newMarkup}"}}}
      ) {
        data {
          commentsLocked
        }
      }
    }
  `
  await runQuery(query, {}, {currentUser: user})
}

describe("syncDocumentWithLatestRevision", () => {
  it("updates with the latest revision", async () => {
    const user = await createDummyUser()
    const post = await createDummyPost(user, {
      contents: {
        originalContents: {
          type: 'ckEditorMarkup',
          data: '<p>Post version 1</p>'
        }
      }
    })

    await updatePost(user, post._id, '<p>Post version 2</p>')
    await updatePost(user, post._id, '<p>Post version 3</p>')

    const postAfterUpdate = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentName: "PostsOriginalContents",
      currentUser: user,
      selector: {_id: post._id},
    });
    if (!postAfterUpdate) {
      throw new Error("Lost post after update")
    }

    expect(postAfterUpdate.contents?.originalContents?.data).toMatch(/version 3/);

    const revisions = await Revisions.find({documentId: post._id}, {sort: {editedAt: 1}}).fetch()
    const lastRevision = revisions[revisions.length-1]
    expect(lastRevision?.originalContents?.data).toMatch(/version 3/)
    await Revisions.rawRemove({_id: lastRevision._id})

    // Function we're actually testing
    await syncDocumentWithLatestRevision(Posts, post, 'contents', createAnonymousContext())

    const postAfterSync = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentName: "PostsOriginalContents",
      currentUser: user,
      selector: {_id: post._id},
    });
    if (!postAfterSync) {
      throw new Error("Lost post after sync")
    }
    expect(postAfterSync.contents?.originalContents?.data).toMatch(/version 2/);
  });
});
