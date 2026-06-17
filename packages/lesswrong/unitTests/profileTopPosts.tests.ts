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

describe("drafts view", () => {
  const draftsView = PostsViews.getView("drafts");

  it("does not include rejected posts by default", () => {
    const terms: PostsViewTerms = {
      view: "drafts",
      userId: "testUserId",
      includeShared: true,
    };

    const params = draftsView(terms);

    expect(params.selector.$or).toEqual([
      { userId: "testUserId", draft: true, unlisted: null },
      { shareWithUsers: "testUserId", draft: true, unlisted: null },
      { coauthorUserIds: "testUserId", draft: true, unlisted: null },
    ]);
  });

  it("can include rejected posts owned by the user", () => {
    const terms: PostsViewTerms = {
      view: "drafts",
      userId: "testUserId",
      includeRejected: true,
      includeShared: true,
    };

    const params = draftsView(terms);

    expect(params.selector.$or).toEqual([
      { userId: "testUserId", draft: true, unlisted: null },
      { shareWithUsers: "testUserId", draft: true, unlisted: null },
      { coauthorUserIds: "testUserId", draft: true, unlisted: null },
      { userId: "testUserId", rejected: true },
    ]);
  });

  it("still excludes shared drafts when includeShared is false", () => {
    const terms: PostsViewTerms = {
      view: "drafts",
      userId: "testUserId",
      includeRejected: true,
      includeShared: false,
    };

    const params = draftsView(terms);

    expect(params.selector.$or).toEqual([
      { userId: "testUserId", draft: true, unlisted: null },
      { userId: "testUserId", rejected: true },
    ]);
  });
});
