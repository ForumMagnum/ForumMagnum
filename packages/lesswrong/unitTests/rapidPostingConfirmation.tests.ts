/**
 * @jest-environment jsdom
 */
// The docstring above switches the jest environment to jsdom, which
// @testing-library/react requires. It must be the first thing in the file.

// Tests for packages/lesswrong/components/posts/useRapidPostingConfirmation.ts

import { act, renderHook } from "@testing-library/react";
import { hasRecentlyPublishedPost, useRapidPostingConfirmation } from "../components/posts/useRapidPostingConfirmation";
import type { EditablePost } from "@/lib/collections/posts/helpers";

const mockQuery = jest.fn();
const mockClient = { query: mockQuery };

jest.mock("@apollo/client/react", () => ({
  useApolloClient: () => mockClient,
}));

jest.mock("@/components/common/withUser", () => ({
  useCurrentUser: () => ({ _id: "currentUser" }),
}));

const noRecentPosts = { data: { posts: { results: [] } } };

const draftPost: EditablePost = {
  _id: "currentPost",
  draft: true,
  tags: [],
  socialPreviewData: null,
  user: null,
  commentCount: 0,
  afCommentCount: 0,
  contents: null,
  contents_latest: null,
  debate: false,
  title: "Draft",
  postCategory: "post",
};

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

describe("useRapidPostingConfirmation", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test("ignores a second publish click while the first check is in progress", async () => {
    let resolveQuery: (result: typeof noRecentPosts) => void = () => {};
    mockQuery.mockReturnValueOnce(new Promise(resolve => { resolveQuery = resolve; }));
    const { result } = renderHook(() => useRapidPostingConfirmation());

    let firstCheck = Promise.resolve(false);
    act(() => {
      firstCheck = result.current.confirmRapidPosting(draftPost);
    });
    expect(result.current.isCheckingRapidPosting).toBe(true);

    let secondCheckResult: boolean | undefined;
    await act(async () => {
      secondCheckResult = await result.current.confirmRapidPosting(draftPost);
    });
    expect(secondCheckResult).toBe(false);
    expect(mockQuery).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveQuery(noRecentPosts);
      expect(await firstCheck).toBe(true);
    });
    expect(result.current.isCheckingRapidPosting).toBe(false);
  });

  test("runs a new check once the previous one has finished", async () => {
    mockQuery.mockResolvedValue(noRecentPosts);
    const { result } = renderHook(() => useRapidPostingConfirmation());

    await act(async () => {
      expect(await result.current.confirmRapidPosting(draftPost)).toBe(true);
    });
    await act(async () => {
      expect(await result.current.confirmRapidPosting(draftPost)).toBe(true);
    });
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
