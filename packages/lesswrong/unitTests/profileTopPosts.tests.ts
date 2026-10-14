import { PostsViews } from "../lib/collections/posts/views";
import { viewTermsToQuery } from "@/lib/utils/viewUtils";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

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

  it("excludes lead-authored posts in the coauthored query before applying its page limit", async () => {
    const params = await viewTermsToQuery(PostsViews, {
      view: "coauthoredPosts",
      userId: "reviewed-user",
      limit: 20,
    }, undefined, createAnonymousContext({ forumType: "LessWrong" }));

    expect(params.selector).toMatchObject({
      userId: { $ne: "reviewed-user" },
      coauthorUserIds: "reviewed-user",
      draft: false,
      unlisted: false,
    });
    expect(params.selector).not.toHaveProperty("$or");
    expect(params.options).toMatchObject({ limit: 20, sort: { postedAt: -1 } });
  });
});
