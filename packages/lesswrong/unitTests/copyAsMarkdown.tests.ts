import { commentToMarkdown, postToMarkdown } from "@/lib/copyAsMarkdown";

const testPost: PostsMarkdownCopy = {
  __typename: "Post",
  _id: "postId1",
  title: "A post about something",
  slug: "a-post-about-something",
  isEvent: false,
  groupId: null,
  url: null,
  postedAt: "2026-07-24T13:05:00Z",
  user: {__typename: "User", _id: "userId1", slug: "alice", displayName: "Alice"},
  coauthors: [],
  contents: {__typename: "Revision", _id: "revId1", markdown: "The body of the post."},
};

const makeComment = (id: string, displayName: string, markdown: string, postedAt: string) => ({
  __typename: "Comment" as const,
  _id: id,
  postId: "postId1",
  parentCommentId: null,
  postedAt,
  user: {__typename: "User" as const, _id: `user-${id}`, slug: displayName.toLowerCase(), displayName},
  contents: {__typename: "Revision" as const, _id: `rev-${id}`, markdown},
  parentComment: null,
});

describe("postToMarkdown", () => {
  it("renders the title, byline, timestamp, link and body", () => {
    expect(postToMarkdown(testPost)).toMatchInlineSnapshot(`
"# A post about something

- **Author:** [Alice](http://localhost:3456/users/alice)
- **Posted:** 2026-07-24 13:05 UTC
- **URL:** http://localhost:3456/posts/postId1/a-post-about-something

The body of the post."
`);
  });

  it("includes coauthors and the linkpost url", () => {
    const linkpost: PostsMarkdownCopy = {
      ...testPost,
      url: "https://example.com/original",
      coauthors: [{__typename: "User", _id: "userId2", slug: "bob", displayName: "Bob"}],
    };
    expect(postToMarkdown(linkpost)).toContain(
      "- **Author:** [Alice](http://localhost:3456/users/alice), [Bob](http://localhost:3456/users/bob)",
    );
    expect(postToMarkdown(linkpost)).toContain("- **Linkpost for:** https://example.com/original");
  });
});

describe("commentToMarkdown", () => {
  it("renders the comment, then the parent post and ancestor comments oldest-first", () => {
    const grandparent = makeComment("c1", "Alice", "Grandparent comment.", "2026-07-24T14:00:00Z");
    const parent = makeComment("c2", "Bob", "Parent comment.", "2026-07-24T15:00:00Z");
    const comment: CommentsMarkdownCopyWithParents = {
      ...makeComment("c3", "Carol", "The comment itself.", "2026-07-24T16:00:00Z"),
      post: testPost,
      parentComment: {...parent, parentComment: grandparent},
    };

    expect(commentToMarkdown(comment)).toMatchInlineSnapshot(`
"# Comment by Carol on "A post about something"

- **Author:** [Carol](http://localhost:3456/users/carol)
- **Posted:** 2026-07-24 16:00 UTC
- **URL:** http://localhost:3456/posts/postId1/a-post-about-something?commentId=c3

The comment itself.

Parent post and comments:

<parentPost>
# A post about something

- **Author:** [Alice](http://localhost:3456/users/alice)
- **Posted:** 2026-07-24 13:05 UTC
- **URL:** http://localhost:3456/posts/postId1/a-post-about-something

The body of the post.
</parentPost>

<parentComments>
## Parent comment 0 by Alice

- **Author:** [Alice](http://localhost:3456/users/alice)
- **Posted:** 2026-07-24 14:00 UTC
- **URL:** http://localhost:3456/posts/postId1/a-post-about-something?commentId=c1

Grandparent comment.

## Parent comment 1 by Bob

- **Author:** [Bob](http://localhost:3456/users/bob)
- **Posted:** 2026-07-24 15:00 UTC
- **URL:** http://localhost:3456/posts/postId1/a-post-about-something?commentId=c2

Parent comment.
</parentComments>"
`);
  });

  it("omits the parent-comments section for a top-level comment", () => {
    const comment: CommentsMarkdownCopyWithParents = {
      ...makeComment("c1", "Alice", "A top-level comment.", "2026-07-24T14:00:00Z"),
      post: testPost,
      parentComment: null,
    };
    const markdown = commentToMarkdown(comment);
    expect(markdown).toContain("<parentPost>");
    expect(markdown).not.toContain("<parentComments>");
  });
});
