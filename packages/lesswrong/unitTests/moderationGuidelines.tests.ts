import { getGuidelinesBodyHtmlForDisplay } from "@/components/comments/ModerationGuidelines/ModerationGuidelinesBox";
import { defaultGuidelinesLW, frontpageGuidelinesLW } from "@/components/comments/ModerationGuidelines/LWModerationGuidelinesContent";

describe("moderation guidelines display", () => {
  it("does not truncate the built-in frontpage comment guidelines", () => {
    const displayedHtml = getGuidelinesBodyHtmlForDisplay({
      bodyHtml: frontpageGuidelinesLW,
      shouldTruncate: false,
    });

    expect(displayedHtml).toContain("Don't be afraid to say 'oops' and change your mind");
    expect(displayedHtml).not.toContain("Read More");
  });

  it("does not truncate the built-in default comment guidelines", () => {
    const displayedHtml = getGuidelinesBodyHtmlForDisplay({
      bodyHtml: defaultGuidelinesLW,
      shouldTruncate: false,
    });

    expect(displayedHtml).toContain("Don't be afraid to say 'oops' and change your mind");
    expect(displayedHtml).not.toContain("Read More");
  });

  it("still truncates long custom guidelines", () => {
    const customGuidelines = `<p>${"Custom moderation guidance. ".repeat(30)}</p>`;
    const displayedHtml = getGuidelinesBodyHtmlForDisplay({
      bodyHtml: customGuidelines,
      shouldTruncate: true,
    });

    expect(displayedHtml).toContain("Read More");
    expect(displayedHtml.length).toBeLessThan(customGuidelines.length);
  });
});
