import { canAccessPostFromLinkSharingEditQuery } from "@/server/ckEditor/ckEditorCallbacks";

const basePost = {
  userId: "author",
  linkSharingKey: "current-key",
  linkSharingKeyUsedBy: ["visitor"],
  shareWithUsers: [],
  sharingSettings: {
    anyoneWithLinkCan: "edit",
    explicitlySharedUsersCan: "comment",
  },
};

function canAccess(overrides: Partial<Parameters<typeof canAccessPostFromLinkSharingEditQuery>[0]> = {}) {
  return canAccessPostFromLinkSharingEditQuery({
    post: basePost,
    currentUserId: "visitor",
    linkSharingKey: "current-key",
    userIsCoauthor: false,
    userCanEditAll: false,
    ...overrides,
  });
}

describe("canAccessPostFromLinkSharingEditQuery", () => {
  it("allows the current canonical link-sharing key", () => {
    expect(canAccess()).toBe(true);
  });

  it("rejects a rotated or stale link-sharing key even for a previous visitor", () => {
    expect(canAccess({
      linkSharingKey: "old-key",
    })).toBe(false);
  });

  it("rejects link access when anyone-with-link sharing is disabled", () => {
    expect(canAccess({
      post: {
        ...basePost,
        sharingSettings: {
          ...basePost.sharingSettings,
          anyoneWithLinkCan: "none",
        },
      },
    })).toBe(false);
  });

  it("allows explicitly shared users without the link key", () => {
    expect(canAccess({
      post: {
        ...basePost,
        shareWithUsers: ["visitor"],
        sharingSettings: {
          anyoneWithLinkCan: "none",
          explicitlySharedUsersCan: "comment",
        },
      },
      linkSharingKey: "old-key",
    })).toBe(true);
  });

  it("allows owners, coauthors, and admins without the link key", () => {
    expect(canAccess({ currentUserId: "author", linkSharingKey: "old-key" })).toBe(true);
    expect(canAccess({ userIsCoauthor: true, linkSharingKey: "old-key" })).toBe(true);
    expect(canAccess({ userCanEditAll: true, linkSharingKey: "old-key" })).toBe(true);
  });
});
