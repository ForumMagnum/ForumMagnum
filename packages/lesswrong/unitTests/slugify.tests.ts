import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("converts latin text", () => {
    expect(slugify("Some Post Title")).toBe("some-post-title");
  });
  it("converts simple unicode text", () => {
    expect(slugify("S'il vous plaît")).toBe("s-il-vous-plait");
    expect(slugify("Тестовый пост")).toBe("testovyi-post");
    expect(slugify("Ένα δείγμα ανάρτησης")).toBe("ena-deigma-anartisis");
  });
  describe("converts Japanese text", () => {
    it("converts hiragana", () => {
      expect(slugify("ひらがな")).toBe("hiragana");
    });
    it("converts katakana", () => {
      expect(slugify("カタカナ")).toBe("katakana");
    });
    it("skips kanji", () => {
      expect(slugify("による「寄付のすすめ」")).toBe("niyoru-nosusume");
    });
  });
  describe("slug cannot be 'edit'", () => {
    expect(slugify("edit")).toBe("edit-1");
  });
  describe("Return 'unicode' for unslugifiable text", () => {
    // We don't currently handle Mandarin
    expect(slugify("一个测试帖")).toBe("unicode");
  });
});
