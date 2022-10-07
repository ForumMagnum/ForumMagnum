import "./integrationTestSetup";
import { createDummyPost, createDummyUser } from "./utils";
import Revisions from "../lib/collections/revisions/collection";
import { Posts } from "../lib/collections/posts";
import { runQuery } from "../server/vulcan-lib";
import { syncDocumentWithLatestRevision } from "../server/editor/utils";
import { dataToWordCount } from "../server/editor/conversionUtils";

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

    const revisions = await Revisions.find({documentId: post._id}, {sort: {editedAt: 1}}).fetch()
    const lastRevision = revisions[revisions.length-1]
    expect(lastRevision?.originalContents.data).toMatch(/version 3/)
    await Revisions.rawRemove({_id: lastRevision._id})
    
    // Function we're actually testing
    await syncDocumentWithLatestRevision(Posts, post, 'contents')

    const postAfterSync = await Posts.findOne({_id: post._id})
    if (!postAfterSync) {
      throw new Error("Lost post")
    }
    expect(postAfterSync.contents.originalContents.data).toMatch(/version 2/);
  });
});

describe("dataToWordCount", () => {
  it("counts words in HTML content", async () => {
    expect(await dataToWordCount("<div><p>A sample piece of content</p></div>", "html")).toBe(5);
  });
  it("counts words in CKEditor content", async () => {
    expect(await dataToWordCount("A sample piece of content", "ckEditorMarkup")).toBe(5);
  });
  it("counts words in DraftJS content", async () => {
    expect(await dataToWordCount({
      blocks: [
        {
          key: "abcde",
          text: "A sample piece of content",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {},
        },
      ],
      entityMap: {},
    }, "draftJS")).toBe(5);
  });
  it("counts words in MD content", async () => {
    expect(await dataToWordCount("A sample piece of content", "markdown")).toBe(5);
  });
  it("excludes simple footnotes", async () => {
    expect(await dataToWordCount(`
A sample piece of content[^1] that has simple footnotes[^2]

[^1]: First footnote

[^2]:

  Second footnote
    `, "markdown")).toBe(9);
  });
  it("excludes complex footnotes", async () => {
    expect(await dataToWordCount(`
A sample piece of content[^footnote1] that has complex footnotes[^footnote2]

1.  ^**[^](#footnote1)**^

  First footnote

2.  ^**[^](#footnote2)**^

  Second footnote
    `, "markdown")).toBe(9);
  });
});
