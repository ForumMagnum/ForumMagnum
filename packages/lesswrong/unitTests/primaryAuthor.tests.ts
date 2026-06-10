import { getPrimaryAuthorTransferFields } from "@/lib/collections/posts/primaryAuthor";

describe("getPrimaryAuthorTransferFields", () => {
  it("promotes a coauthor and moves the previous primary author into that coauthor slot", () => {
    expect(getPrimaryAuthorTransferFields({
      currentPrimaryUserId: "authorA",
      coauthorUserIds: ["authorB", "authorC"],
      promotedUserId: "authorB",
    })).toEqual({
      userId: "authorB",
      coauthorUserIds: ["authorA", "authorC"],
    });

    expect(getPrimaryAuthorTransferFields({
      currentPrimaryUserId: "authorA",
      coauthorUserIds: ["authorB", "authorC"],
      promotedUserId: "authorC",
    })).toEqual({
      userId: "authorC",
      coauthorUserIds: ["authorB", "authorA"],
    });
  });

  it("does not duplicate the previous primary author if it was already in coauthors", () => {
    expect(getPrimaryAuthorTransferFields({
      currentPrimaryUserId: "authorA",
      coauthorUserIds: ["authorA", "authorB", "authorC"],
      promotedUserId: "authorB",
    })).toEqual({
      userId: "authorB",
      coauthorUserIds: ["authorA", "authorC"],
    });
  });
});
