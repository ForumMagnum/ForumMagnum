import { getLatestLlmVersion, LLM_FAMILIES, type LlmFamily } from "@/lib/languageModels/llmRegistry";
import { getLlmMentionPath, getMentionableLlms, getMentionedLlmVersion } from "@/lib/llmReplies/llmMentions";
import { llmReplyStartsAsPreview, LLM_REPLY_EXPAND_KARMA } from "@/lib/llmReplies/helpers";
import { getFirstMentionedLlm } from "@/server/llmReplies/mentionedLlms";
import { getPublicMarkdownPath } from "@/server/languageModels/publicMarkdown";

const testFamily: LlmFamily = {
  name: "Test",
  accountSlug: "test-model",
  versions: [
    { name: "Test3", fullName: "Test Model 3", gatewayModelId: "test/3", retired: true },
    { name: "Test2", fullName: "Test Model 2", gatewayModelId: "test/2", retired: false },
    { name: "Test1", fullName: "Test Model 1", gatewayModelId: "test/1", retired: false },
  ],
};

describe("getLatestLlmVersion", () => {
  it("skips retired versions", () => {
    expect(getLatestLlmVersion(testFamily)?.name).toBe("Test2");
  });
});

describe("getMentionedLlmVersion", () => {
  it("resolves a mention without a version to the latest", () => {
    expect(getMentionedLlmVersion(testFamily, null)?.name).toBe("Test2");
  });

  it("resolves a named version", () => {
    expect(getMentionedLlmVersion(testFamily, "Test1")?.name).toBe("Test1");
  });

  it("summons nothing for a retired or unknown version", () => {
    expect(getMentionedLlmVersion(testFamily, "Test3")).toBeUndefined();
    expect(getMentionedLlmVersion(testFamily, "Test9")).toBeUndefined();
  });
});

describe("getMentionableLlms", () => {
  it("offers the latest version when typing a family name", () => {
    expect(getMentionableLlms("Op").map(({ version }) => version.name)).toEqual(["Opus5.5"]);
  });

  it("matches versions by name, case-insensitively", () => {
    expect(getMentionableLlms("chatgpt-sol6").map(({ version }) => version.name)).toEqual(["ChatGPT-Sol6.1"]);
  });

  it("offers nothing for unrelated text", () => {
    expect(getMentionableLlms("Zz")).toEqual([]);
  });
});

describe("getFirstMentionedLlm", () => {
  const opus = LLM_FAMILIES.find((family) => family.name === "Opus")!;
  const gemini = LLM_FAMILIES.find((family) => family.name === "Gemini")!;
  const mentionLink = (family: LlmFamily) => `<a href="${getLlmMentionPath({ family, version: getLatestLlmVersion(family)! })}">@${family.name}</a>`;

  it("returns only the first model mentioned", () => {
    const html = `<p>${mentionLink(gemini)} and ${mentionLink(opus)}, is this true?</p>`;
    expect(getFirstMentionedLlm(html, "LessWrong")?.family.name).toBe("Gemini");
  });

  it("ignores links to model accounts that aren't mentions", () => {
    const html = `<p><a href="/users/opus">Opus's profile</a></p>`;
    expect(getFirstMentionedLlm(html, "LessWrong")).toBeNull();
  });

  it("resolves a mention without a version to the latest", () => {
    const html = `<p><a href="/users/opus?mention=user">@Opus</a></p>`;
    expect(getFirstMentionedLlm(html, "LessWrong")?.version.name).toBe("Opus5.5");
  });
});

describe("llmReplyStartsAsPreview", () => {
  it("previews model replies below the karma threshold", () => {
    expect(llmReplyStartsAsPreview({ llmRunId: "run", baseScore: LLM_REPLY_EXPAND_KARMA - 1 })).toBe(true);
    expect(llmReplyStartsAsPreview({ llmRunId: "run", baseScore: LLM_REPLY_EXPAND_KARMA })).toBe(false);
  });

  it("never previews human comments", () => {
    expect(llmReplyStartsAsPreview({ llmRunId: null, baseScore: 0 })).toBe(false);
  });
});

describe("getPublicMarkdownPath", () => {
  it("maps post URLs on lesswrong.com to the post Markdown API", () => {
    expect(getPublicMarkdownPath("https://www.lesswrong.com/posts/abc123/some-slug", "LessWrong")).toBe("/api/post/abc123");
  });

  it("maps comment permalinks to the comment Markdown API", () => {
    expect(getPublicMarkdownPath("/posts/abc123/some-slug?commentId=def456", "LessWrong")).toBe("/api/post/abc123/comments/def456");
  });

  it("passes Markdown API paths through", () => {
    expect(getPublicMarkdownPath("/api/search?search=foo", "LessWrong")).toBe("/api/search?search=foo");
  });

  it("rejects other sites, including lookalike domains", () => {
    expect(getPublicMarkdownPath("https://example.com/posts/abc123/some-slug", "LessWrong")).toBeNull();
    expect(getPublicMarkdownPath("https://notlesswrong.com/posts/abc123/some-slug", "LessWrong")).toBeNull();
  });

  it("returns null for pages without a Markdown version", () => {
    expect(getPublicMarkdownPath("/notARealPage/xyz/abc", "LessWrong")).toBeNull();
  });
});
