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
  commentIds: ["ancestor", "anchor", "reply"],
};

describe("digest discussion threads shared by email and site", () => {
  it("nests the anchor beneath its context and its replies beneath it", () => {
    const thread = aiDigestDiscussionThread(item, {
      postsById: new Map(),
      commentsById: new Map([ancestor, anchor, reply].map((value) => [value._id, value])),
    });
    expect(thread.contextCommentIds).toEqual(["ancestor"]);
    expect(thread.roots).toEqual([
      { item: ancestor, children: [{ item: anchor, children: [{ item: reply, children: [] }] }] },
    ]);
  });

  it("roots the thread at the anchor when the context is no longer available", () => {
    const thread = aiDigestDiscussionThread(item, {
      postsById: new Map(),
      commentsById: new Map([anchor, reply].map((value) => [value._id, value])),
    });
    expect(thread.roots).toEqual([{ item: anchor, children: [{ item: reply, children: [] }] }]);
  });
});
