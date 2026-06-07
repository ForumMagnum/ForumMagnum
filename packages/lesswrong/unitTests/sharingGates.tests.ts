import { userCanShareWithUsers, userCanUseSharing, type SharingGateUser } from "../lib/betas";

describe("sharing permission gates", () => {
  const lowKarmaUser: SharingGateUser = {
    karma: 0,
  };

  const trustedUser: SharingGateUser = {
    karma: 2,
  };

  const approvedUser: SharingGateUser = {
    karma: 0,
    reviewedByUserId: "moderator-id",
  };

  const moderator: SharingGateUser = {
    karma: 0,
    groups: ["sunshineRegiment"],
  };

  it("allows any logged-in user to use link sharing", () => {
    expect(userCanUseSharing(null)).toBe(false);
    expect(userCanUseSharing(lowKarmaUser)).toBe(true);
  });

  it("keeps direct user sharing limited to trusted users and moderators", () => {
    expect(userCanShareWithUsers(null)).toBe(false);
    expect(userCanShareWithUsers(lowKarmaUser)).toBe(false);
    expect(userCanShareWithUsers(trustedUser)).toBe(true);
    expect(userCanShareWithUsers(approvedUser)).toBe(true);
    expect(userCanShareWithUsers(moderator)).toBe(true);
  });
});
