import "../integrationTestSetup";
import { runQuery } from '../../server/vulcan-lib/query';
import {
  createDummyUser,
  createDummyPost,
  catchGraphQLErrors,
  assertIsPermissionsFlavoredError,
  withNoLogs,
} from '../utils'
import { Chapters } from '../../server/collections/chapters/collection';
import { Posts } from '../../server/collections/posts/collection';
import { Revisions } from '../../server/collections/revisions/collection';

async function addChapterAs(user: DbUser, sequenceId: string, postIds: string[]): Promise<string> {
  const response = await runQuery(`
    mutation {
      createChapter(data: {sequenceId: "${sequenceId}", number: 2, postIds: ${JSON.stringify(postIds)}}) {
        data { _id }
      }
    }
  `, {}, {currentUser: user});
  return response.data?.createChapter.data._id;
}

async function setChapterPostsAs(user: DbUser, chapterId: string, postIds: string[]) {
  await runQuery(`
    mutation {
      updateChapter(selector: {_id: "${chapterId}"}, data: {postIds: ${JSON.stringify(postIds)}}) {
        data { _id }
      }
    }
  `, {}, {currentUser: user});
}

async function setChapterNumberAs(user: DbUser, chapterId: string, number: number) {
  await runQuery(`
    mutation {
      updateChapter(selector: {_id: "${chapterId}"}, data: {number: ${number}}) {
        data { _id }
      }
    }
  `, {}, {currentUser: user});
}

async function createSequenceAs(user: DbUser): Promise<{sequenceId: string, chapterId: string}> {
  const response = await runQuery(`
    mutation {
      createSequence(data: {title: "Test sequence"}) {
        data { _id }
      }
    }
  `, {}, {currentUser: user});
  const sequenceId: string = response.data?.createSequence.data._id;
  const chapters = await Chapters.find({sequenceId}).fetch();
  return {sequenceId, chapterId: chapters[0]?._id};
}

describe('Chapters editing by sequence owners', () => {
  const graphQLerrors = catchGraphQLErrors();

  it("creates a sequence's first chapter before createSequence returns", async () => {
    const owner = await createDummyUser();
    const { sequenceId } = await createSequenceAs(owner);
    const chapters = await Chapters.find({sequenceId}).fetch();
    chapters.length.should.equal(1);
  });

  it("lets the sequence owner set a chapter title", async () => {
    const owner = await createDummyUser();
    const { chapterId } = await createSequenceAs(owner);
    const response = await runQuery(`
      mutation {
        updateChapter(selector: {_id: "${chapterId}"}, data: {title: "Part One"}) {
          data { title }
        }
      }
    `, {}, {currentUser: owner});
    response.data?.updateChapter.data.title.should.equal("Part One");
  });

  it("lets the sequence owner set a chapter description", async () => {
    const owner = await createDummyUser();
    const { chapterId } = await createSequenceAs(owner);
    const response = await runQuery(`
      mutation {
        updateChapter(
          selector: {_id: "${chapterId}"},
          data: {contents: {originalContents: {type: "html", data: "<p>An intro</p>"}}}
        ) {
          data { contents { html } }
        }
      }
    `, {}, {currentUser: owner});
    response.data?.updateChapter.data.contents.html.should.equal("<p>An intro</p>");
  });

  it("lets the sequence owner reorder chapters by number", async () => {
    const owner = await createDummyUser();
    const { chapterId } = await createSequenceAs(owner);
    const response = await runQuery(`
      mutation {
        updateChapter(selector: {_id: "${chapterId}"}, data: {number: 3}) {
          data { number }
        }
      }
    `, {}, {currentUser: owner});
    response.data?.updateChapter.data.number.should.equal(3);
  });

  it("doesn't let another user add a chapter to someone else's sequence", async () => {
    const owner = await createDummyUser();
    const otherUser = await createDummyUser();
    const { sequenceId } = await createSequenceAs(owner);
    await withNoLogs(async () => {
      await addChapterAs(otherUser, sequenceId, []).should.be.rejected;
    });
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
    (await Chapters.find({sequenceId}).fetch()).length.should.equal(1);
  });

  it("doesn't let another user set a chapter title", async () => {
    const owner = await createDummyUser();
    const otherUser = await createDummyUser();
    const { chapterId } = await createSequenceAs(owner);
    await withNoLogs(async () => {
      const response = runQuery(`
        mutation {
          updateChapter(selector: {_id: "${chapterId}"}, data: {title: "Hijacked"}) {
            data { title }
          }
        }
      `, {}, {currentUser: otherUser});
      await response.should.be.rejected;
    });
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
  });
});

describe('deleteChapter', () => {
  const graphQLerrors = catchGraphQLErrors();

  const deleteChapterAs = (user: DbUser, chapterId: string) => runQuery(`
    mutation { deleteChapter(chapterId: "${chapterId}") }
  `, {}, {currentUser: user});

  it("deletes an empty chapter for the sequence owner", async () => {
    const owner = await createDummyUser();
    const { sequenceId } = await createSequenceAs(owner);
    const secondChapterId = await addChapterAs(owner, sequenceId, []);
    await deleteChapterAs(owner, secondChapterId);
    const remaining = await Chapters.find({sequenceId}).fetch();
    remaining.map(c => c._id).should.not.include(secondChapterId);
    remaining.length.should.equal(1);
  });

  it("deletes the chapter's description revisions with it", async () => {
    const owner = await createDummyUser();
    const { sequenceId } = await createSequenceAs(owner);
    const secondChapterId = await addChapterAs(owner, sequenceId, []);
    await runQuery(`
      mutation {
        updateChapter(
          selector: {_id: "${secondChapterId}"},
          data: {contents: {originalContents: {type: "html", data: "<p>An intro</p>"}}}
        ) {
          data { _id }
        }
      }
    `, {}, {currentUser: owner});
    (await Revisions.find({documentId: secondChapterId}).fetch()).length.should.be.greaterThan(0);

    await deleteChapterAs(owner, secondChapterId);

    (await Revisions.find({documentId: secondChapterId}).fetch()).length.should.equal(0);
  });

  it("refuses to delete a chapter that still has posts", async () => {
    const owner = await createDummyUser();
    const post = await createDummyPost(owner);
    const { sequenceId } = await createSequenceAs(owner);
    const secondChapterId = await addChapterAs(owner, sequenceId, [post._id]);
    await withNoLogs(async () => {
      await deleteChapterAs(owner, secondChapterId).should.be.rejectedWith("Chapter must be empty");
    });
    graphQLerrors.getErrors();
  });

  it("refuses to delete a sequence's last chapter", async () => {
    const owner = await createDummyUser();
    const { chapterId } = await createSequenceAs(owner);
    await withNoLogs(async () => {
      await deleteChapterAs(owner, chapterId).should.be.rejectedWith("Cannot delete a sequence's last chapter");
    });
    graphQLerrors.getErrors();
  });

  it("refuses to delete a chapter in someone else's sequence", async () => {
    const owner = await createDummyUser();
    const otherUser = await createDummyUser();
    const { sequenceId } = await createSequenceAs(owner);
    const secondChapterId = await addChapterAs(owner, sequenceId, []);
    await withNoLogs(async () => {
      await deleteChapterAs(otherUser, secondChapterId).should.be.rejected;
    });
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
    (await Chapters.find({sequenceId}).fetch()).length.should.equal(2);
  });
});

describe('moveSequencePost', () => {
  const graphQLerrors = catchGraphQLErrors();

  const moveAs = (user: DbUser, postId: string, fromChapterId: string, toChapterId: string, toIndex: number) => runQuery(`
    mutation {
      moveSequencePost(postId: "${postId}", fromChapterId: "${fromChapterId}", toChapterId: "${toChapterId}", toIndex: ${toIndex})
    }
  `, {}, {currentUser: user});

  it("moves a post to the given position in another chapter", async () => {
    const owner = await createDummyUser();
    const [postA, postB, postC] = [await createDummyPost(owner), await createDummyPost(owner), await createDummyPost(owner)];
    const { sequenceId, chapterId } = await createSequenceAs(owner);
    await setChapterPostsAs(owner, chapterId, [postA._id, postB._id]);
    const secondChapterId = await addChapterAs(owner, sequenceId, [postC._id]);

    await moveAs(owner, postB._id, chapterId, secondChapterId, 0);

    (await Chapters.findOne(chapterId))?.postIds.should.deep.equal([postA._id]);
    (await Chapters.findOne(secondChapterId))?.postIds.should.deep.equal([postB._id, postC._id]);
  });

  it("updates the posts' previous/next links to the new order", async () => {
    const owner = await createDummyUser();
    const [postA, postB, postC] = [await createDummyPost(owner), await createDummyPost(owner), await createDummyPost(owner)];
    const { sequenceId, chapterId } = await createSequenceAs(owner);
    await setChapterNumberAs(owner, chapterId, 1);
    await setChapterPostsAs(owner, chapterId, [postA._id, postB._id]);
    const secondChapterId = await addChapterAs(owner, sequenceId, [postC._id]);

    // The reading order goes from A, B, C to B, C, A
    await moveAs(owner, postA._id, chapterId, secondChapterId, 1);

    const movedPost = await Posts.findOne(postA._id);
    expect(movedPost?.canonicalSequenceId).toBe(sequenceId);
    expect(movedPost?.canonicalPrevPostSlug).toBe(postC.slug);
    expect(movedPost?.canonicalNextPostSlug).toBe("");
    expect((await Posts.findOne(postB._id))?.canonicalNextPostSlug).toBe(postC.slug);
  });

  it("refuses to move a post into a chapter of a different sequence", async () => {
    const owner = await createDummyUser();
    const post = await createDummyPost(owner);
    const { chapterId } = await createSequenceAs(owner);
    const { chapterId: otherSequenceChapterId } = await createSequenceAs(owner);
    await setChapterPostsAs(owner, chapterId, [post._id]);
    await withNoLogs(async () => {
      await moveAs(owner, post._id, chapterId, otherSequenceChapterId, 0).should.be.rejectedWith("Both chapters must be in the same sequence");
    });
    graphQLerrors.getErrors();
    (await Chapters.findOne(chapterId))?.postIds.should.deep.equal([post._id]);
    (await Chapters.findOne(otherSequenceChapterId))?.postIds.should.deep.equal([]);
  });

  it("refuses to move a post that isn't in the source chapter", async () => {
    const owner = await createDummyUser();
    const post = await createDummyPost(owner);
    const { sequenceId, chapterId } = await createSequenceAs(owner);
    const secondChapterId = await addChapterAs(owner, sequenceId, []);
    await withNoLogs(async () => {
      await moveAs(owner, post._id, chapterId, secondChapterId, 0).should.be.rejectedWith("Post is not in the source chapter");
    });
    graphQLerrors.getErrors();
    (await Chapters.findOne(secondChapterId))?.postIds.should.deep.equal([]);
  });

  it("refuses to 'move' a post within one chapter", async () => {
    const owner = await createDummyUser();
    const post = await createDummyPost(owner);
    const { chapterId } = await createSequenceAs(owner);
    await setChapterPostsAs(owner, chapterId, [post._id]);
    await withNoLogs(async () => {
      await moveAs(owner, post._id, chapterId, chapterId, 0).should.be.rejectedWith("Use updateChapter to reorder posts within a chapter");
    });
    graphQLerrors.getErrors();
  });

  it("refuses to move a post in someone else's sequence", async () => {
    const owner = await createDummyUser();
    const otherUser = await createDummyUser();
    const post = await createDummyPost(owner);
    const { sequenceId, chapterId } = await createSequenceAs(owner);
    await setChapterPostsAs(owner, chapterId, [post._id]);
    const secondChapterId = await addChapterAs(owner, sequenceId, []);
    await withNoLogs(async () => {
      await moveAs(otherUser, post._id, chapterId, secondChapterId, 0).should.be.rejected;
    });
    assertIsPermissionsFlavoredError(graphQLerrors.getErrors());
    (await Chapters.findOne(chapterId))?.postIds.should.deep.equal([post._id]);
  });
});
