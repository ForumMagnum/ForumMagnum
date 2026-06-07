import { markdownApiDocumentationMarkdown } from "../../../app/api/(markdown)/SKILL.md/route";

describe("markdown API documentation", () => {
  it("documents the first-write insertBlock caveat for never-opened drafts", () => {
    const docs = markdownApiDocumentationMarkdown("https://www.lesswrong.com");

    expect(docs).toContain("First-write caveat");
    expect(docs).toContain("Lexical editor root is empty after Hocuspocus sync");
    expect(docs).toContain("Ask the user to open the");
    expect(docs).toContain("draft in the editor once");
    expect(docs).toContain("use commentOnDraft instead");
  });
});
