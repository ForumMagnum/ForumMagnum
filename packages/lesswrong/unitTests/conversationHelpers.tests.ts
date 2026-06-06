import { getDmBlockingParticipant } from "../lib/collections/conversations/helpers";

describe("getDmBlockingParticipant", () => {
  it("returns null when no participant has blocked the sender", () => {
    expect(getDmBlockingParticipant("sender", [
      {_id: "sender", blockedUserIds: ["recipient"]},
      {_id: "recipient", blockedUserIds: []},
    ])).toBeNull();
  });

  it("returns the participant who has blocked the sender", () => {
    expect(getDmBlockingParticipant("sender", [
      {_id: "sender"},
      {_id: "recipient", blockedUserIds: ["sender"]},
    ])).toEqual({_id: "recipient", blockedUserIds: ["sender"]});
  });

  it("ignores a sender blocking themselves", () => {
    expect(getDmBlockingParticipant("sender", [
      {_id: "sender", blockedUserIds: ["sender"]},
    ])).toBeNull();
  });
});
