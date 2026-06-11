import {
  DEFAULT_DRAFT_TITLE,
  getPostPublishValidationError,
} from "@/lib/collections/posts/publishValidation";

describe("post publish validation", () => {
  it("allows placeholder-title drafts to keep autosaving", () => {
    expect(getPostPublishValidationError({
      title: DEFAULT_DRAFT_TITLE,
      draft: true,
      contents: { wordCount: 0 },
    })).toBeNull();
  });

  it("rejects publishing a post with the default draft title", () => {
    expect(getPostPublishValidationError({
      title: DEFAULT_DRAFT_TITLE,
      draft: false,
      contents: { wordCount: 50 },
    })).toBe("Add a real title before publishing.");
  });

  it("rejects publishing a non-linkpost with essentially empty body text", () => {
    expect(getPostPublishValidationError({
      title: "A Real Title",
      draft: false,
      contents: { wordCount: 5 },
    })).toBe("Add some body text before publishing.");
  });

  it("allows publishing linkposts with a URL and no body text", () => {
    expect(getPostPublishValidationError({
      title: "A Linkpost",
      draft: false,
      postCategory: "linkpost",
      url: "https://example.com",
      contents: { wordCount: 0 },
    })).toBeNull();
  });

  it("allows publishing events without body text", () => {
    expect(getPostPublishValidationError({
      title: "A Meetup",
      draft: false,
      isEvent: true,
      contents: { wordCount: 0 },
    })).toBeNull();
  });
});
