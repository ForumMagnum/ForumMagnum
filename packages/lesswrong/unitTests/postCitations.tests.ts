import {
  escapeBibtex,
  getBibtexKey,
  getGoogleScholarSearchUrl,
  getPostBibtex,
  getPostCitation,
  getPostPlainTextCitation,
  getWaybackArchiveUrl,
  getWaybackSaveUrl,
  PostCitation,
} from '../lib/collections/posts/citations';

const samplePost = {
  _id: "abc123",
  slug: "the-affect-heuristic",
  title: "The Affect Heuristic",
  postedAt: "2007-11-27T22:07:00.000Z",
  user: { displayName: "Eliezer Yudkowsky" },
  coauthors: [],
};

const sampleCitation: PostCitation = {
  title: "The Affect Heuristic",
  authors: ["Eliezer Yudkowsky"],
  publishedAt: new Date("2007-11-27T22:07:00.000Z"),
  url: "https://www.lesswrong.com/posts/abc123/the-affect-heuristic",
  siteName: "LessWrong",
  timezone: "GMT",
};

const accessedAt = new Date("2026-09-06T12:00:00.000Z");

describe('getPostCitation', () => {
  it('collects the author and coauthors in order', () => {
    const citation = getPostCitation({
      ...samplePost,
      coauthors: [{ displayName: "Coauthor One" }, { displayName: "Coauthor Two" }],
    });
    expect(citation.authors).toEqual(["Eliezer Yudkowsky", "Coauthor One", "Coauthor Two"]);
    expect(citation.title).toBe("The Affect Heuristic");
    expect(citation.publishedAt?.toISOString()).toBe("2007-11-27T22:07:00.000Z");
    expect(citation.url).toMatch(/\/posts\/abc123\/the-affect-heuristic$/);
  });

  it('omits only the primary author when the post hides its author', () => {
    const citation = getPostCitation({ ...samplePost, hideAuthor: true });
    expect(citation.authors).toEqual([]);
    const withCoauthor = getPostCitation({ ...samplePost, hideAuthor: true, coauthors: [{ displayName: "Coauthor" }] });
    expect(withCoauthor.authors).toEqual(["Coauthor"]);
  });

  it('omits deleted accounts, matching the byline', () => {
    const citation = getPostCitation({
      ...samplePost,
      user: { displayName: "Gone", deleted: true },
      coauthors: [{ displayName: "Still Here", deleted: false }, { displayName: "Also Gone", deleted: true }],
    });
    expect(citation.authors).toEqual(["Still Here"]);
  });

  it('defaults to the site timezone and accepts a reader timezone', () => {
    expect(getPostCitation(samplePost).timezone).toBe("GMT");
    expect(getPostCitation(samplePost, "America/Los_Angeles").timezone).toBe("America/Los_Angeles");
  });

  it('handles posts that have never been published', () => {
    const citation = getPostCitation({ ...samplePost, postedAt: null });
    expect(citation.publishedAt).toBeNull();
  });
});

describe('escapeBibtex', () => {
  it('escapes LaTeX special characters', () => {
    expect(escapeBibtex("50% of {A & B} cost $5 #1 a_b ~ x^2 \\ y"))
      .toBe("50\\% of \\{A \\& B\\} cost \\$5 \\#1 a\\_b \\textasciitilde{} x\\textasciicircum{}2 \\textbackslash{} y");
  });
});

describe('getBibtexKey', () => {
  it('uses the first author surname, year, and first significant title word', () => {
    expect(getBibtexKey(sampleCitation, "abc123")).toBe("yudkowsky2007affect");
  });

  it('falls back to the site name when there is no author', () => {
    expect(getBibtexKey({ ...sampleCitation, authors: [] }, "abc123")).toBe("lesswrong2007affect");
  });

  it('strips non-ASCII characters and falls back to the post id', () => {
    expect(getBibtexKey({ ...sampleCitation, authors: ["Émile Ålund"], title: "Ünïcode" }, "abc123")).toBe("alund2007unicode");
    expect(getBibtexKey({ ...sampleCitation, authors: ["日本語"], title: "日本語", publishedAt: null }, "abc123")).toBe("abc123");
  });
});

describe('getPostBibtex', () => {
  it('renders a @misc entry with braced author names', () => {
    expect(getPostBibtex({ ...sampleCitation, authors: ["Eliezer Yudkowsky", "Scott & Co"] }, "abc123", accessedAt)).toBe(
`@misc{yudkowsky2007affect,
  author = {{Eliezer Yudkowsky} and {Scott \\& Co}},
  title = {{The Affect Heuristic}},
  year = {2007},
  month = nov,
  publisher = {LessWrong},
  howpublished = {\\url{https://www.lesswrong.com/posts/abc123/the-affect-heuristic}},
  urldate = {2026-09-06},
  note = {Accessed 2026-09-06}
}
`);
  });

  it('omits author and date fields when they are unknown', () => {
    const bibtex = getPostBibtex({ ...sampleCitation, authors: [], publishedAt: null }, "abc123", accessedAt);
    expect(bibtex).not.toContain("author =");
    expect(bibtex).not.toContain("year =");
    expect(bibtex).not.toContain("month =");
    expect(bibtex).toContain("@misc{lesswrongaffect,");
  });
});

describe('citation dates', () => {
  // 2007-12-31 23:30 Pacific is 2008-01-01 07:30 UTC
  const newYearsEvePacific: PostCitation = {
    ...sampleCitation,
    publishedAt: new Date("2008-01-01T07:30:00.000Z"),
    timezone: "America/Los_Angeles",
  };

  it('renders the date in the citation timezone, matching the page', () => {
    expect(getPostPlainTextCitation(newYearsEvePacific)).toContain("(2007, December 31)");
    expect(getPostPlainTextCitation({ ...newYearsEvePacific, timezone: "GMT" })).toContain("(2008, January 1)");
    const bibtex = getPostBibtex(newYearsEvePacific, "abc123", new Date("2026-09-06T22:00:00.000Z"));
    expect(bibtex).toContain("@misc{yudkowsky2007affect,");
    expect(bibtex).toContain("year = {2007}");
    expect(bibtex).toContain("month = dec");
    // 22:00 UTC on Sep 6 is still Sep 6 in Los Angeles
    expect(bibtex).toContain("urldate = {2026-09-06}");
    expect(getPostBibtex({ ...newYearsEvePacific, timezone: "Australia/Sydney" }, "abc123", new Date("2026-09-06T22:00:00.000Z")))
      .toContain("urldate = {2026-09-07}");
  });
});

describe('getPostPlainTextCitation', () => {
  it('formats a single-author citation', () => {
    expect(getPostPlainTextCitation(sampleCitation)).toBe(
      "Eliezer Yudkowsky. (2007, November 27). The Affect Heuristic. LessWrong. https://www.lesswrong.com/posts/abc123/the-affect-heuristic"
    );
  });

  it('joins multiple authors with commas and an ampersand', () => {
    expect(getPostPlainTextCitation({ ...sampleCitation, authors: ["A", "B"] })).toMatch(/^A & B\. /);
    expect(getPostPlainTextCitation({ ...sampleCitation, authors: ["A", "B", "C"] })).toMatch(/^A, B, & C\. /);
  });

  it('uses the site as the author when the author is hidden, and n.d. when undated', () => {
    expect(getPostPlainTextCitation({ ...sampleCitation, authors: [], publishedAt: null })).toBe(
      "LessWrong. (n.d.). The Affect Heuristic. https://www.lesswrong.com/posts/abc123/the-affect-heuristic"
    );
  });
});

describe('external citation links', () => {
  it('builds Internet Archive and Google Scholar URLs', () => {
    expect(getWaybackArchiveUrl(sampleCitation.url)).toBe("https://web.archive.org/web/https://www.lesswrong.com/posts/abc123/the-affect-heuristic");
    expect(getWaybackSaveUrl(sampleCitation.url)).toBe("https://web.archive.org/save/https://www.lesswrong.com/posts/abc123/the-affect-heuristic");
    expect(getGoogleScholarSearchUrl(sampleCitation)).toBe("https://scholar.google.com/scholar?q=%22The%20Affect%20Heuristic%22");
  });

  it('drops double quotes from the title so the phrase search stays intact', () => {
    expect(getGoogleScholarSearchUrl({ ...sampleCitation, title: 'Why "Rationality" Matters' }))
      .toBe("https://scholar.google.com/scholar?q=%22Why%20Rationality%20Matters%22");
  });
});
