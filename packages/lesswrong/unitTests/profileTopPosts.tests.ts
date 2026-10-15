import { PostsViews } from "../lib/collections/posts/views";

describe("profile top posts", () => {
  const userPostsView = PostsViews.getView("userPosts");

  it("preserves the legacy userPosts rejected selector by default", () => {
    const terms: PostsViewTerms = {
      view: "userPosts",
      userId: "testUserId",
    };

    const params = userPostsView(terms);

    expect(params.selector).toMatchObject({
      rejected: null,
    });
  });

  it("can exclude rejected posts from userPosts results", () => {
    const terms: PostsViewTerms = {
      view: "userPosts",
      userId: "testUserId",
      filter: "notRejected",
    };

    const params = userPostsView(terms);

    expect(params.selector).toMatchObject({
      rejected: { $ne: true },
    });
  });
});
