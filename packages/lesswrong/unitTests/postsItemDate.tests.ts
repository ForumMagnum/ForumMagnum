import { getPostsItemDateToDisplay } from "@/components/posts/PostsItemDate";

describe("getPostsItemDateToDisplay", () => {
  const postedAt = "2026-03-27T13:41:00.000Z";
  const curatedDate = "2026-05-19T06:59:00.000Z";

  it("uses the posted date when curated dates are disabled", () => {
    expect(getPostsItemDateToDisplay({ postedAt, curatedDate }, false)).toBe(postedAt);
  });

  it("uses the curated date when curated dates are enabled", () => {
    expect(getPostsItemDateToDisplay({ postedAt, curatedDate }, true)).toBe(curatedDate);
  });

  it("falls back to the posted date when there is no curated date", () => {
    expect(getPostsItemDateToDisplay({ postedAt, curatedDate: null }, true)).toBe(postedAt);
  });
});
