import { extractFootnoteHTML } from "@/components/linkPreview/FootnotePreview";

describe("extractFootnoteHTML", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("uses the full source HTML instead of a truncated rendered footnote", () => {
    document.body.innerHTML = `
      <li id="fn-comment-1">
        <div class="footnote-content"><p>o</p></div>
      </li>
    `;
    const fullCommentHtml = `
      <p>Comment text.<sup><a href="#fn-comment-1">1</a></sup></p>
      <li id="fn-comment-1">
        <div class="footnote-content">
          <p>of course we don't have an end-of-days answer.</p>
        </div>
      </li>
    `;

    const footnoteHtml = extractFootnoteHTML("#fn-comment-1", fullCommentHtml);

    expect(footnoteHtml).toContain("of course we don't have an end-of-days answer.");
  });

  it("continues to use the rendered document when no source HTML is supplied", () => {
    document.body.innerHTML = `
      <li id="fn-post-1">
        <div class="footnote-content"><p>Rendered footnote.</p></div>
      </li>
    `;

    expect(extractFootnoteHTML("#fn-post-1")).toContain("Rendered footnote.");
  });
});
