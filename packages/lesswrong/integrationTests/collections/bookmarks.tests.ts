import "../integrationTestSetup";
import { randomId } from "@/lib/random";
import { Bookmarks } from "@/server/collections/bookmarks/collection";
import { runQuery } from "@/server/vulcan-lib/query";
import { createDummyComment, createDummyPost, createDummyUser } from "@/integrationTests/utils";

const createActiveBookmark = async (
  userId: string,
  documentId: string,
  collectionName: "Posts" | "Comments"
) => {
  const now = new Date();
  await Bookmarks.rawInsert({
    _id: randomId(),
    userId,
    documentId,
    collectionName,
    active: true,
    createdAt: now,
    lastUpdated: now,
  });
};

describe("isBookmarked", () => {
  it("resolves every bookmark when multiple documents are loaded in one request", async () => {
    const user = await createDummyUser();
    const firstPost = await createDummyPost(user);
    const secondPost = await createDummyPost(user);
    const firstComment = await createDummyComment(user, { postId: firstPost._id });
    const secondComment = await createDummyComment(user, { postId: secondPost._id });

    await Promise.all([
      createActiveBookmark(user._id, firstPost._id, "Posts"),
      createActiveBookmark(user._id, secondPost._id, "Posts"),
      createActiveBookmark(user._id, firstComment._id, "Comments"),
      createActiveBookmark(user._id, secondComment._id, "Comments"),
    ]);

    const query = `
      query MultipleIsBookmarkedFields {
        firstPost: post(selector: { _id: "${firstPost._id}" }) {
          result {
            isBookmarked
          }
        }
        secondPost: post(selector: { _id: "${secondPost._id}" }) {
          result {
            isBookmarked
          }
        }
        firstComment: comment(selector: { _id: "${firstComment._id}" }) {
          result {
            isBookmarked
          }
        }
        secondComment: comment(selector: { _id: "${secondComment._id}" }) {
          result {
            isBookmarked
          }
        }
      }
    `;

    await expect(runQuery(query, {}, { currentUser: user })).resolves.toEqual({
      data: {
        firstPost: { result: { isBookmarked: true } },
        secondPost: { result: { isBookmarked: true } },
        firstComment: { result: { isBookmarked: true } },
        secondComment: { result: { isBookmarked: true } },
      },
    });
  });
});
