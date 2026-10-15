// Tests for packages/lesswrong/components/posts/useRapidPostingConfirmation.ts

import { hasRecentlyPublishedPost } from "../components/posts/useRapidPostingConfirmation";

const now = new Date("2026-10-15T00:30:00Z");
const minutesAgo = (minutes: number) => new Date(now.getTime() - (minutes * 60 * 1000)).toISOString();
const post = (overrides: Partial<{ _id: string, postedAt: string, shortform: boolean, isEvent: boolean }>) => ({
  _id: "otherPost",
  postedAt: minutesAgo(3),
  shortform: false,
  isEvent: false,
  ...overrides,
});

describe("hasRecentlyPublishedPost", () => {
  test("detects a post published within the last 10 minutes", () => {
    expect(hasRecentlyPublishedPost([post({})], "currentPost", now)).toBe(true);
  });

  test("ignores posts published more than 10 minutes ago", () => {
    expect(hasRecentlyPublishedPost([post({ postedAt: minutesAgo(11) })], "currentPost", now)).toBe(false);
  });

  test("ignores the post currently being published", () => {
    expect(hasRecentlyPublishedPost([post({ _id: "currentPost" })], "currentPost", now)).toBe(false);
  });

  test("ignores events and the shortform container post", () => {
    expect(hasRecentlyPublishedPost([post({ isEvent: true }), post({ shortform: true })], "currentPost", now)).toBe(false);
  });

  test("handles new posts with no id yet", () => {
    expect(hasRecentlyPublishedPost([post({})], undefined, now)).toBe(true);
    expect(hasRecentlyPublishedPost([], undefined, now)).toBe(false);
  });
});
