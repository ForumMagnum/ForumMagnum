import { findMathSpansInMarkdown, stripMathTokens, formatMathToken, foldCaseOutsideMath, canonicalizeMathTokens } from "@/lib/utils/mathTokens";

describe("findMathSpansInMarkdown", () => {
  it("detects an inline equation", () => {
    expect(findMathSpansInMarkdown("before $x^2$ after")).toEqual([
      { start: 7, end: 12, inline: true, equation: "x^2" },
    ]);
  });

  it("detects a display equation", () => {
    expect(findMathSpansInMarkdown("$$\nx^2\n$$")).toEqual([
      { start: 0, end: 9, inline: false, equation: "x^2" },
    ]);
  });

  it("detects `\\(...\\)` delimiters", () => {
    expect(findMathSpansInMarkdown("a \\(x\\) b")).toEqual([
      { start: 2, end: 7, inline: true, equation: "x" },
    ]);
  });

  it("detects multiple equations in order", () => {
    expect(findMathSpansInMarkdown("$a$ and $b$")).toEqual([
      { start: 0, end: 3, inline: true, equation: "a" },
      { start: 8, end: 11, inline: true, equation: "b" },
    ]);
  });

  it("does not mistake currency for math", () => {
    expect(findMathSpansInMarkdown("Costs $5 and $10 today.")).toEqual([]);
  });

  it("rejects a closing $ followed by a digit", () => {
    expect(findMathSpansInMarkdown("price $x$5 here")).toEqual([]);
  });

  it("rejects an opening $ followed by whitespace", () => {
    expect(findMathSpansInMarkdown("a $ x$ b")).toEqual([]);
  });

  it("returns nothing for math-free prose", () => {
    expect(findMathSpansInMarkdown("just some ordinary text")).toEqual([]);
  });

  it("treats an escaped dollar sign as literal text, not a math opener", () => {
    // `\$` is an escaped dollar — markdown-it does not parse `\$x$` as math.
    expect(findMathSpansInMarkdown("\\$x$")).toEqual([]);
  });

  it("handles many unclosed openers without quadratic blow-up", () => {
    // Correctness smoke test: many unclosed `\(` openers yield no spans, and
    // the linear scanner returns promptly rather than re-scanning per opener.
    expect(findMathSpansInMarkdown("\\(".repeat(20000))).toEqual([]);
  });

  it("does not pair dollar signs across a blank line (block boundary)", () => {
    // markdown-it's inline tokenizer runs per-paragraph; a phantom span here
    // would swallow the heading between the two prose dollars.
    expect(findMathSpansInMarkdown(
      "damages of ~$1 trillion are possible\n\n### A heading\n\nsee the report ($)",
    )).toEqual([]);
  });

  it("reads same-paragraph prose dollars as currency, not an equation", () => {
    expect(findMathSpansInMarkdown("they raised $2B from investors ($), roughly")).toEqual([]);
  });

  it("still recognizes digit-leading real math", () => {
    expect(findMathSpansInMarkdown("the bound $2^{100}$ holds")).toHaveLength(1);
    expect(findMathSpansInMarkdown("we get $2x$ as expected")).toHaveLength(1);
    // Math operators distinguish a spaced equation from prose currency.
    expect(findMathSpansInMarkdown("so $2 + 2 = 4$ holds")).toHaveLength(1);
  });
});

describe("stripMathTokens", () => {
  it("removes equations but keeps the surrounding text", () => {
    expect(stripMathTokens("a $x^2$ b")).toBe("a  b");
  });

  it("leaves literal dollar text intact", () => {
    expect(stripMathTokens("Costs $5 and $10 today.")).toBe("Costs $5 and $10 today.");
  });

  it("does not strip escaped-dollar text", () => {
    expect(stripMathTokens("\\$x$")).toBe("\\$x$");
  });
});

describe("canonicalizeMathTokens", () => {
  it("collapses every display delimiter shape to one canonical form", () => {
    expect(canonicalizeMathTokens("$$x^2$$")).toBe("$$\nx^2\n$$");
    expect(canonicalizeMathTokens("$$\nx^2\n$$")).toBe("$$\nx^2\n$$");
    expect(canonicalizeMathTokens("\\[x^2\\]")).toBe("$$\nx^2\n$$");
  });

  it("collapses every inline delimiter shape to one canonical form", () => {
    expect(canonicalizeMathTokens("$x^2$")).toBe("$x^2$");
    expect(canonicalizeMathTokens("\\(x^2\\)")).toBe("$x^2$");
  });

  it("leaves literal dollar text untouched", () => {
    expect(canonicalizeMathTokens("Costs $5 and $10")).toBe("Costs $5 and $10");
  });
});

describe("formatMathToken", () => {
  it("formats inline equations", () => {
    expect(formatMathToken({ equation: "x^2", inline: true })).toBe("$x^2$");
  });

  it("formats display equations", () => {
    expect(formatMathToken({ equation: "x^2", inline: false })).toBe("$$\nx^2\n$$");
  });

  it("falls back to \\(...\\) for an inline equation followed by a digit", () => {
    // `$x$5` is not re-parsable as math (texMath's currency rule), so the
    // bare-`$` form is unsafe before a digit.
    expect(formatMathToken({ equation: "x", inline: true }, "5")).toBe("\\(x\\)");
    expect(formatMathToken({ equation: "x", inline: true }, " ")).toBe("$x$");
    expect(formatMathToken({ equation: "x", inline: true })).toBe("$x$");
  });

  it("falls back to \\(...\\) for an equation hostile to the bare-$ form", () => {
    // A literal `$` in the body and a trailing backslash both break `$...$`.
    expect(formatMathToken({ equation: "a$b", inline: true })).toBe("\\(a$b\\)");
    expect(formatMathToken({ equation: "x\\", inline: true })).toBe("\\(x\\\\)");
  });

  it("trims edge whitespace from the equation", () => {
    expect(formatMathToken({ equation: "  x  ", inline: true })).toBe("$x$");
    expect(formatMathToken({ equation: " x ", inline: false })).toBe("$$\nx\n$$");
  });
});

describe("canonicalizeMathTokens digit-adjacency", () => {
  it("keeps a digit-adjacent equation in the digit-safe form", () => {
    expect(canonicalizeMathTokens("\\(x\\)5 apples")).toBe("\\(x\\)5 apples");
  });

  it("uses the bare-$ form when no digit follows", () => {
    expect(canonicalizeMathTokens("\\(x\\) apples")).toBe("$x$ apples");
  });
});

describe("foldCaseOutsideMath", () => {
  it("lower-cases prose but preserves equation case", () => {
    expect(foldCaseOutsideMath("Hello $X$ and $\\Frac$ World")).toBe("hello $X$ and $\\Frac$ world");
  });

  it("lower-cases math-free prose", () => {
    expect(foldCaseOutsideMath("MixedCase Text")).toBe("mixedcase text");
  });
});

describe("LaTeX correctness regressions", () => {
  it("rejects a $$...$$ whose closing $$ is backslash-escaped (matching texMath)", () => {
    // texMath rejects a closing delimiter immediately preceded by `\`; the
    // $$...$$ branch of findMathSpansInMarkdown must do the same.
    expect(findMathSpansInMarkdown("$$x\\$$")).toEqual([]);
  });

  it("never emits a \\(...\\) form that fails to round-trip", () => {
    // `a$b\)c` breaks the bare-$ form (embedded $) and contains the `\)` closer,
    // so it is unrepresentable in inline math — formatMathToken must degrade to
    // the conventional `$…$` form rather than emit a known-broken `\(…\)`.
    const equation = "a$b\\)c";
    const token = formatMathToken({ equation, inline: true });
    if (token.startsWith("\\(")) {
      const spans = findMathSpansInMarkdown(token);
      expect(spans).toHaveLength(1);
      expect(spans[0].equation).toBe(equation);
    } else {
      expect(token).toBe("$" + equation + "$");
    }
  });

  it("treats a $ adjacent to a carriage return as math, matching texMath", () => {
    // texMath's whitespace set is space/tab/LF only; isMathWhitespace must not
    // additionally treat CR as delimiter-blocking.
    const cr = String.fromCharCode(13);
    expect(findMathSpansInMarkdown("$" + cr + "x$")).toHaveLength(1);
  });
});
