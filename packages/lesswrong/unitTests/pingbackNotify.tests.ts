import { getNewlyLinkedDocuments } from "@/server/editor/pingback-notify";
import { summarizeLinkedDocuments } from "@/lib/collections/notifications/pingbackNotificationContext";

describe("getNewlyLinkedDocuments", () => {
  it("returns every linked post and comment for a newly created document", () => {
    expect(getNewlyLinkedDocuments({
      _id: "new",
      pingbacks: { Posts: ["post1"], Comments: ["comment1"] },
    }, undefined)).toEqual([
      { documentType: "post", documentId: "post1" },
      { documentType: "comment", documentId: "comment1" },
    ]);
  });

  it("returns only links which weren't in the previous version", () => {
    expect(getNewlyLinkedDocuments(
      { _id: "doc", pingbacks: { Posts: ["post1", "post2"] } },
      { _id: "doc", pingbacks: { Posts: ["post1"] } },
    )).toEqual([{ documentType: "post", documentId: "post2" }]);
  });

  it("returns nothing when the links are unchanged", () => {
    expect(getNewlyLinkedDocuments(
      { _id: "doc", pingbacks: { Posts: ["post1"] } },
      { _id: "doc", pingbacks: { Posts: ["post1"] } },
    )).toEqual([]);
  });

  it("returns all links when a draft is published", () => {
    expect(getNewlyLinkedDocuments(
      { _id: "doc", draft: false, pingbacks: { Posts: ["post1", "post2"] } },
      { _id: "doc", draft: true, pingbacks: { Posts: ["post1"] } },
    )).toEqual([
      { documentType: "post", documentId: "post1" },
      { documentType: "post", documentId: "post2" },
    ]);
  });

  it("skips links to the linking document's own thread", () => {
    expect(getNewlyLinkedDocuments({
      _id: "comment2",
      postId: "post1",
      parentCommentId: "comment1",
      pingbacks: { Posts: ["post1", "post2"], Comments: ["comment1", "comment2", "comment3"] },
    }, undefined)).toEqual([
      { documentType: "post", documentId: "post2" },
      { documentType: "comment", documentId: "comment3" },
    ]);
  });

  it("caps how many linked documents a single edit notifies about", () => {
    const manyPostIds = Array.from({ length: 30 }, (_, i) => `post${i}`);
    expect(getNewlyLinkedDocuments({ _id: "doc", pingbacks: { Posts: manyPostIds } }, undefined)).toHaveLength(20);
  });
});

describe("summarizeLinkedDocuments", () => {
  it("describes a single linked document by type", () => {
    expect(summarizeLinkedDocuments([{ documentType: "post", documentId: "post1" }])).toBe("your post");
    expect(summarizeLinkedDocuments([{ documentType: "comment", documentId: "comment1" }])).toBe("your comment");
  });

  it("counts multiple linked documents", () => {
    expect(summarizeLinkedDocuments([
      { documentType: "post", documentId: "post1" },
      { documentType: "post", documentId: "post2" },
    ])).toBe("2 of your posts");

    expect(summarizeLinkedDocuments([
      { documentType: "post", documentId: "post1" },
      { documentType: "comment", documentId: "comment1" },
    ])).toBe("2 of your posts and comments");
  });
});
