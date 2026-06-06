import { NextRequest } from "next/server";
import { selectMarkdownUserProfile } from "../../../app/api/(markdown)/user/[slug]/userProfileSelection";

const mockRunQuery = jest.fn();

jest.mock("@/server/vulcan-lib/query", () => ({
  runQuery: mockRunQuery,
}));

jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({
  getContextFromReqAndRes: jest.fn(async () => ({})),
}));

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

describe("/api/user/[slug] markdown route", () => {
  beforeEach(() => {
    mockRunQuery.mockReset();
  });

  it("renders the canonical active user when an empty exact slug also matches", async () => {
    mockRunQuery
      .mockResolvedValueOnce({
        data: {
          users: {
            results: [
              {
                _id: "empty-user",
                slug: "habryka",
                displayName: "habryka",
                username: null,
                bio: null,
                karma: 0,
                afKarma: 0,
                postCount: 0,
                commentCount: 1,
                createdAt: null,
              },
              {
                _id: "canonical-user",
                slug: "habryka4",
                displayName: "habryka",
                username: null,
                bio: "Running Lightcone Infrastructure.",
                karma: 61180,
                afKarma: 1925,
                postCount: 296,
                commentCount: 6581,
                createdAt: null,
              },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          topPosts: { results: [] },
          recentPosts: { results: [] },
        },
      })
      .mockResolvedValueOnce({
        data: {
          comments: { results: [] },
        },
      });

    const { GET } = await import("../../../app/api/(markdown)/user/[slug]/route");
    const response = await GET(
      new NextRequest("https://www.lesswrong.com/api/user/habryka"),
      { params: Promise.resolve({ slug: "habryka" }) },
    );
    const markdown = await response.text();

    expect(mockRunQuery.mock.calls[1][1]).toMatchObject({ userId: "canonical-user" });
    expect(markdown).toContain("Profile URL (HTML): [/users/habryka4](/users/habryka4)");
    expect(markdown).toMatch(/\*\s+Karma: 61180/);
    expect(markdown).toMatch(/\*\s+Posts: 296/);
  });
});
