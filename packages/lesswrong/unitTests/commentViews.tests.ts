import { CommentsViews } from "../lib/collections/comments/views";

describe("comment views", () => {
  const userPostLWCommentsView = CommentsViews.getView("userPostLWComments");

  it("selects a user's LessWrong-side comments on a post", () => {
    const terms: CommentsViewTerms = {
      view: "userPostLWComments",
      postId: "testPostId",
      userId: "testUserId",
    };

    const params = userPostLWCommentsView(terms);

    expect(params.selector).toMatchObject({
      postId: "testPostId",
      userId: "testUserId",
      af: false,
      answer: false,
    });
  });
});
