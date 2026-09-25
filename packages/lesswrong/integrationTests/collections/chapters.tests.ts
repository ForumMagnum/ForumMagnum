import "../integrationTestSetup";
import { runQuery } from '../../server/vulcan-lib/query';
import {
  createDummyUser,
  catchGraphQLErrors,
  assertIsPermissionsFlavoredError,
  withNoLogs,
} from '../utils'
import { Chapters } from '../../server/collections/chapters/collection';

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
