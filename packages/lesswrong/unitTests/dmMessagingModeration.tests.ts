import { computeUpdatedUsersContactedBeforeReview } from "@/server/utils/dmMessagingModeration";

describe("computeUpdatedUsersContactedBeforeReview", () => {
  it("returns null when no other participants exist", () => {
    const result = computeUpdatedUsersContactedBeforeReview({
      participantIds: ["userA"],
      currentUserId: "userA",
      previousContacts: [],
    });

    expect(result).toBeNull();
  });

  it("collects new participants that have not been contacted yet", () => {
    const result = computeUpdatedUsersContactedBeforeReview({
      participantIds: ["userA", "userB", "userC"],
      currentUserId: "userA",
      previousContacts: [],
    });

    expect(result).toEqual(["userB", "userC"]);
  });

  it("ignores duplicates and already-contacted users", () => {
    const result = computeUpdatedUsersContactedBeforeReview({
      participantIds: ["userA", "userB", "userC", "userC"],
      currentUserId: "userA",
      previousContacts: ["userB"],
    });

    expect(result).toEqual(["userB", "userC"]);
  });
});
