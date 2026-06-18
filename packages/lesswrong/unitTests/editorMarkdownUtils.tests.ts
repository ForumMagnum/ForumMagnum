import { htmlToYjsStateFromHtml } from "@/server/editor/htmlToYjsState";
import { getLexicalMarkdownFromYjsSnapshot } from "../../../app/api/(markdown)/editorMarkdownUtils";

describe("getLexicalMarkdownFromYjsSnapshot", () => {
  it("renders a saved Lexical Yjs snapshot as agent markdown", async () => {
    const { yjsState } = await htmlToYjsStateFromHtml(
      "<p>Saved <strong>draft</strong> body from revision state.</p>",
    );

    const markdown = getLexicalMarkdownFromYjsSnapshot(yjsState);

    expect(markdown).toContain("Saved");
    expect(markdown).toContain("draft");
    expect(markdown).toContain("revision state");
  });
});
