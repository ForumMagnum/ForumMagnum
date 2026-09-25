import { aiDigestDiscussionThread } from "@/lib/aiDigest/aiDigestDisplay";
import type { AiDigestEmailComment } from "@/lib/generated/gql-codegen/graphql";

function comment(_id: string, parentCommentId: string | null): AiDigestEmailComment {
  return {
    _id, parentCommentId, postedAt: "2026-09-01", shortform: false,
    tagCommentType: "DISCUSSION", contents: null, user: null, post: null, tag: null,
  };
}

const ancestor = comment("ancestor", null);
const anchor = comment("anchor", "ancestor");
const reply = comment("reply", "anchor");
const item: AiDigestItem = {
  documentRef: { documentType: "comment", documentId: "anchor" },
  placement: "full",
  contextComments: [{ commentId: "ancestor" }],
  threadComments: [{ commentId: "reply" }],
};

describe("digest discussion context shared by email and site", () => {
  it("attaches the selected comment and its replies beneath available context", () => {
    const tree = aiDigestDiscussionThread(item, anchor, {
      postsById: new Map(),
      commentsById: new Map([ancestor, anchor, reply].map((value) => [value._id, value])),
    });
    expect(tree.rootComment).toBe(ancestor);
    expect(tree.contextCommentIds).toEqual(["ancestor"]);
    expect(tree.threadReplies).toEqual([{ comment: anchor, replies: [{ comment: reply, replies: [] }] }]);
  });

  it("keeps the selected comment and replies when an ancestor is unavailable", () => {
    const tree = aiDigestDiscussionThread(item, anchor, {
      postsById: new Map(),
      commentsById: new Map([[reply._id, reply]]),
    });
    expect(tree.rootComment).toBe(anchor);
    expect(tree.contextCommentIds).toEqual([]);
    expect(tree.threadReplies).toEqual([{ comment: reply, replies: [] }]);
  });
});
