import { getSyntheticUltraFeedScenario } from "@/server/scripts/seedSyntheticUltraFeed";

describe("synthetic UltraFeed seed scenario", () => {
  it("defines recent posts that qualify for UltraFeed latest/subscribed queries", () => {
    const scenario = getSyntheticUltraFeedScenario();

    expect(scenario.posts.length).toBeGreaterThanOrEqual(3);
    for (const post of scenario.posts) {
      expect(post.baseScore).toBeGreaterThanOrEqual(2);
      expect(post.postedAtHoursAgo).toBeLessThan(30 * 24);
      expect(post.comments.length).toBeGreaterThan(0);
    }
  });

  it("includes a multi-coauthor fixture with long display names", () => {
    const scenario = getSyntheticUltraFeedScenario();
    const authorsByUsername = new Map(scenario.authors.map(author => [author.username, author]));
    const longCoauthorPost = scenario.posts.find(post => post.coauthorUsernames.length >= 2);

    expect(longCoauthorPost?.title).toContain("long coauthors");
    const coauthorNames = longCoauthorPost?.coauthorUsernames.map(username => authorsByUsername.get(username)?.displayName) ?? [];
    expect(coauthorNames.some(name => (name?.length ?? 0) > 40)).toBe(true);
  });

  it("bookmarks only posts present in the scenario", () => {
    const scenario = getSyntheticUltraFeedScenario();
    const postTitles = new Set(scenario.posts.map(post => post.title));

    expect(scenario.bookmarkedPostTitles.length).toBeGreaterThan(0);
    for (const title of scenario.bookmarkedPostTitles) {
      expect(postTitles.has(title)).toBe(true);
    }
  });
});
