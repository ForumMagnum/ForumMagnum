import { getActiveDmBlock } from "../lib/collections/conversations/helpers";

describe("getActiveDmBlock", () => {
  it("returns null when there is no active block against the sender", () => {
    expect(getActiveDmBlock("sender", [
      {userId: "sender", blockedUserId: "recipient", blocked: true},
      {userId: "recipient", blockedUserId: "sender", blocked: false},
    ])).toBeNull();
  });

  it("returns the active block against the sender", () => {
    expect(getActiveDmBlock("sender", [
      null,
      {userId: "recipient", blockedUserId: "sender", blocked: true},
    ])).toEqual({userId: "recipient", blockedUserId: "sender", blocked: true});
  });

  it("ignores a sender blocking themselves", () => {
    expect(getActiveDmBlock("sender", [
      {userId: "sender", blockedUserId: "sender", blocked: true},
    ])).toBeNull();
  });
});
