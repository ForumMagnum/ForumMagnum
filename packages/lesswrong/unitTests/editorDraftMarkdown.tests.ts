import { renderEditorDraftMarkdown } from "../../../app/api/(markdown)/editorMarkdownUtils";

describe("renderEditorDraftMarkdown", () => {
  it("includes the author and coauthors", async () => {
    const response = await renderEditorDraftMarkdown({
      title: "My Draft",
      postId: "abc123",
      author: { slug: "alice", displayName: "Alice" },
      coauthors: [{ slug: "bob", displayName: "Bob" }],
      bodyMarkdown: "Body text",
      forumType: "LessWrong",
    });
    const markdown = await response.text();
    expect(markdown).toMatch(/By \[Alice\]\([^)]*\/users\/alice\), \[Bob\]\([^)]*\/users\/bob\)/);
  });

  it("omits the author line when there is no author", async () => {
    const response = await renderEditorDraftMarkdown({
      title: "My Draft",
      postId: "abc123",
      author: null,
      bodyMarkdown: "Body text",
      forumType: "LessWrong",
    });
    const markdown = await response.text();
    expect(markdown).not.toMatch(/^By /m);
  });
});
