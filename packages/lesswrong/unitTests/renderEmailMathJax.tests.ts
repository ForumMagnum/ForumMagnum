import { normalizeMathJaxTagsForEmail } from "@/server/emails/renderEmail";

describe("normalizeMathJaxTagsForEmail", () => {
  it("leaves non-MathJax email HTML unchanged", () => {
    const html = "<div>&nbsp;<span>ordinary email content</span></div>";

    expect(normalizeMathJaxTagsForEmail(html)).toBe(html);
  });

  it("converts MathJax custom tags to spans while preserving inlined styles", () => {
    const html = `
      <span class="math-tex">
        <mjx-container jax="CHTML" style="display: inline-block;">
          <mjx-math>
            <mjx-mi style="font-style: italic;">C</mjx-mi>
          </mjx-math>
        </mjx-container>
      </span>
    `;

    const normalized = normalizeMathJaxTagsForEmail(html);

    expect(normalized).not.toContain("<mjx-");
    expect(normalized).not.toContain("</mjx-");
    expect(normalized).toContain('class="math-tex"');
    expect(normalized).toContain('<span jax="CHTML" style="display: inline-block;">');
    expect(normalized).toContain('<span style="font-style: italic;">C</span>');
  });
});
