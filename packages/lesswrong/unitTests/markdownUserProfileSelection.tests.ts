import { selectMarkdownUserProfile } from "../../../app/api/(markdown)/user/[slug]/userProfileSelection";

describe("selectMarkdownUserProfile", () => {
  it("keeps an exact slug match when it has public profile activity", () => {
    const exactUser = {
      slug: "new-user",
      karma: 3,
      afKarma: 0,
      postCount: 0,
      commentCount: 0,
      bio: null,
    };
    const oldSlugUser = {
      slug: "established-user",
      karma: 500,
      afKarma: 0,
      postCount: 5,
      commentCount: 100,
      bio: null,
    };

    expect(selectMarkdownUserProfile("new-user", [exactUser, oldSlugUser])).toBe(exactUser);
  });

  it("prefers an active canonical account over an empty duplicate exact slug", () => {
    const emptyExactUser = {
      slug: "habryka",
      karma: 0,
      afKarma: 0,
      postCount: 0,
      commentCount: 1,
      bio: null,
    };
    const canonicalUser = {
      slug: "habryka4",
      karma: 61180,
      afKarma: 1925,
      postCount: 296,
      commentCount: 6581,
      bio: "Running Lightcone Infrastructure.",
    };

    expect(selectMarkdownUserProfile("habryka", [emptyExactUser, canonicalUser])).toBe(canonicalUser);
  });

  it("returns null when no users match", () => {
    expect(selectMarkdownUserProfile("missing-user", [])).toBeNull();
  });
});
