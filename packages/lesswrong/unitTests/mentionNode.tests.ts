import {
  extractMentionTokens,
  formatMentionToken,
  rewriteMentionTokens,
  tryParseMentionAt,
} from "../components/research/lexical/mentionFormat";

describe("formatMentionToken", () => {
  it("emits the canonical @[kind:id \"title\"] form for a doc", () => {
    expect(formatMentionToken({ kind: "doc", id: "abc123", title: "Zoning notes" }))
      .toBe('@[doc:abc123 "Zoning notes"]');
  });

  it("emits the canonical form for a conv", () => {
    expect(formatMentionToken({ kind: "conv", id: "def456", title: "Earlier zoning chat" }))
      .toBe('@[conv:def456 "Earlier zoning chat"]');
  });

  it("escapes embedded double quotes and backslashes", () => {
    expect(formatMentionToken({ kind: "doc", id: "x", title: 'a "quoted" \\path' }))
      .toBe('@[doc:x "a \\"quoted\\" \\\\path"]');
  });

  it("collapses newlines so chips can't break inline placement", () => {
    expect(formatMentionToken({ kind: "doc", id: "x", title: "line one\nline two\r\nline three" }))
      .toBe('@[doc:x "line one line two line three"]');
  });
});

describe("tryParseMentionAt", () => {
  it("parses a mention at position 0", () => {
    const m = tryParseMentionAt('@[doc:abc "Notes"]', 0);
    expect(m).toEqual({
      kind: "doc",
      id: "abc",
      title: "Notes",
      raw: '@[doc:abc "Notes"]',
      index: 0,
    });
  });

  it("parses at a non-zero offset (with leading text)", () => {
    const text = 'see @[conv:def "A chat"] now';
    const m = tryParseMentionAt(text, 4);
    expect(m?.kind).toBe("conv");
    expect(m?.id).toBe("def");
    expect(m?.title).toBe("A chat");
  });

  it("returns null when the position doesn't start with @[", () => {
    expect(tryParseMentionAt('not a mention', 0)).toBeNull();
  });

  it("returns null on malformed tokens", () => {
    expect(tryParseMentionAt('@[doc:abc no quotes]', 0)).toBeNull();
    expect(tryParseMentionAt('@[unknown:abc "x"]', 0)).toBeNull();
  });

  it("unescapes embedded quotes/backslashes", () => {
    const m = tryParseMentionAt('@[doc:x "a \\"quoted\\" \\\\path"]', 0);
    expect(m?.title).toBe('a "quoted" \\path');
  });
});

describe("extractMentionTokens / rewriteMentionTokens", () => {
  it("extracts every token in source order", () => {
    const text = 'A @[doc:a "First"] then @[conv:b "Second"] end.';
    const tokens = extractMentionTokens(text);
    expect(tokens.map(t => t.id)).toEqual(['a', 'b']);
    expect(tokens.map(t => t.title)).toEqual(['First', 'Second']);
  });

  it("returns empty array when no tokens present", () => {
    expect(extractMentionTokens('plain text')).toEqual([]);
  });

  it("rewrite swaps titles per the callback", () => {
    const out = rewriteMentionTokens(
      'See @[doc:abc "stale title"] for context.',
      (m) => ({ kind: m.kind, id: m.id, title: 'Fresh Title' }),
    );
    expect(out).toBe('See @[doc:abc "Fresh Title"] for context.');
  });

  it("rewrite preserves non-mention text exactly", () => {
    const text = 'Pre **bold** [link](http://x) @[doc:a "T"] post @[conv:b "U"] end.';
    const out = rewriteMentionTokens(text, (m) => ({ ...m, title: m.title.toUpperCase() }));
    expect(out).toBe('Pre **bold** [link](http://x) @[doc:a "T"] post @[conv:b "U"] end.');
  });
});
