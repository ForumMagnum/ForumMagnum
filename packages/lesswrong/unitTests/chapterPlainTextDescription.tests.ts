import { descriptionHtmlToPlainText, plainTextToDescriptionHtml } from "@/lib/collections/chapters/plainTextDescription";

describe("plainTextToDescriptionHtml", () => {
  it("makes one paragraph per blank-line-separated block", () => {
    expect(plainTextToDescriptionHtml("First part.\n\nSecond part."))
      .toBe("<p>First part.</p><p>Second part.</p>");
  });

  it("keeps single line breaks as <br>", () => {
    expect(plainTextToDescriptionHtml("Line one\nLine two"))
      .toBe("<p>Line one<br>Line two</p>");
  });

  it("escapes HTML special characters", () => {
    expect(plainTextToDescriptionHtml(`<b>"Tom" & 'Jerry'</b>`))
      .toBe("<p>&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;</p>");
  });

  it("returns an empty string for blank input", () => {
    expect(plainTextToDescriptionHtml("  \n\n  ")).toBe("");
  });

  it("ignores extra blank lines and surrounding whitespace", () => {
    expect(plainTextToDescriptionHtml("\n  One  \n\n\n\nTwo\n"))
      .toBe("<p>One</p><p>Two</p>");
  });
});

describe("descriptionHtmlToPlainText", () => {
  it("turns paragraphs into blank-line-separated text", () => {
    expect(descriptionHtmlToPlainText("<p>First part.</p><p>Second part.</p>"))
      .toBe("First part.\n\nSecond part.");
  });

  it("turns <br> into a line break", () => {
    expect(descriptionHtmlToPlainText("<p>Line one<br>Line two</p>"))
      .toBe("Line one\nLine two");
  });

  it("drops formatting tags but keeps their text", () => {
    expect(descriptionHtmlToPlainText("<p>It <em>has text,</em> <strong>in all kinds of formats.</strong></p>"))
      .toBe("It has text, in all kinds of formats.");
  });

  it("handles stray document wrappers", () => {
    expect(descriptionHtmlToPlainText("<html><head></head><body><p>Misc Updates</p></body></html>"))
      .toBe("Misc Updates");
  });

  it("decodes HTML entities", () => {
    expect(descriptionHtmlToPlainText("<p>humanity&apos;s &amp; ours&nbsp;too</p>"))
      .toBe("humanity's & ours too");
  });

  it("round-trips text produced by plainTextToDescriptionHtml", () => {
    const text = "Winter <solstice> & \"friends\"\nOnce upon a time\n\nThe end";
    expect(descriptionHtmlToPlainText(plainTextToDescriptionHtml(text))).toBe(text);
  });

  it("returns an empty string for empty HTML", () => {
    expect(descriptionHtmlToPlainText("")).toBe("");
  });
});
