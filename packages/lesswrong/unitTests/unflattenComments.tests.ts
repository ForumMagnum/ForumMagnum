import { assert } from "chai";
import { appendMissingComments, unflattenComments } from "@/lib/utils/unflatten";

interface TestComment {
  _id: string;
  parentCommentId?: string | null;
}

describe("comment tree utilities", () => {
  it("adds missing linked-thread context without duplicating loaded comments", () => {
    const loadedComments: TestComment[] = [
      { _id: "root" },
      { _id: "linked", parentCommentId: "parent" },
    ];
    const linkedThread: TestComment[] = [
      { _id: "root" },
      { _id: "parent", parentCommentId: "root" },
      { _id: "linked", parentCommentId: "parent" },
      { _id: "reply", parentCommentId: "linked" },
    ];

    const mergedComments = appendMissingComments(loadedComments, linkedThread);
    const commentTree = unflattenComments(mergedComments);

    assert.deepEqual(mergedComments.map(comment => comment._id), [
      "root",
      "linked",
      "parent",
      "reply",
    ]);
    assert.deepEqual(
      commentTree[0].children[0].children[0].children.map(child => child.item._id),
      ["reply"],
    );
  });
});
