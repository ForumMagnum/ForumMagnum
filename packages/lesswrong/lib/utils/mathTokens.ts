/**
 * Canonical handling of math tokens in agent-facing markdown — the single
 * source of truth for "what is a math token", "how does an equation
 * serialize", and "how is case folded around equations".
 *
 * The agent read API emits equations as `$…$` / `$$…$$`, and agents also
 * produce the `\(…\)` / `\[…\]` forms; all four are recognized here.
 *
 * KNOWN LIMITATION: `\begin{env}…\end{env}` AMS environments (`align`,
 * `cases`, …) are NOT recognized as math tokens by this module. markdown-it's
 * math rule does parse them, so an agent that sends a bare
 * `\begin{align}…\end{align}` still gets a MathNode on the write path — but
 * the matcher utilities here (`findMathSpansInMarkdown` and everything built
 * on it) treat that text as prose, so `foldCaseOutsideMath` would lowercase
 * it and quote-matching against it is unreliable. The read API only ever
 * emits `$…$` / `$$…$$`, so agents are not expected to use bare `\begin{}`
 * syntax; supporting it would require coordinated changes here, in
 * `formatMathToken`, and in `MathNode`'s delimiter parsing.
 */

export interface MathSpan {
  start: number
  /** Exclusive. */
  end: number
  inline: boolean
  /** Content between the delimiters, trimmed. */
  equation: string
}

export interface MathToken {
  equation: string
  inline: boolean
}

// texMath's whitespace set is space / tab / newline only — deliberately not
// carriage return — so the scanner must mirror exactly that set.
const isMathWhitespace = (ch: string | undefined): boolean =>
  ch === " " || ch === "\t" || ch === "\n";

const isAsciiDigit = (ch: string | undefined): boolean =>
  ch !== undefined && ch >= "0" && ch <= "9";

/**
 * Locate every math token in a markdown string, in source order, in a single
 * linear-time pass.
 *
 * The `$…$` rules mirror markdown-it's `texMath` inline tokenizer (see
 * `markdownMathjax.ts`): the opening `$` must not be followed by whitespace,
 * and the closing `$` must not be preceded by whitespace, escaped with a
 * backslash, nor followed by a digit — which is what keeps currency like
 * `$5 and $10` from being mistaken for an equation. A backslash escapes the
 * character after it, so an escaped `\$` is literal text, not a math opener.
 *
 * `$$…$$`, `\(…\)`, and `\[…\]` have fixed closing delimiters; once one of
 * them has no closer in the remaining text, no later opener of that type can
 * have one either, so the scan for it stops — which keeps the pass linear
 * even on input with many unclosed openers.
 */
export function findMathSpansInMarkdown(markdown: string): MathSpan[] {
  const spans: MathSpan[] = [];
  let displayDollarExhausted = false;
  let parenExhausted = false;
  let bracketExhausted = false;
  let i = 0;
  while (i < markdown.length) {
    const ch = markdown[i];
    if (ch === "$") {
      if (markdown[i + 1] === "$") {
        // `$$…$$` display. A third `$` means "too many markers" (texMath).
        if (markdown[i + 2] !== "$" && !displayDollarExhausted) {
          const close = markdown.indexOf("$$", i + 2);
          if (close < 0) {
            displayDollarExhausted = true;
          } else if (markdown[close - 1] !== "\\") {
            spans.push({ start: i, end: close + 2, inline: false, equation: markdown.slice(i + 2, close).trim() });
            i = close + 2;
            continue;
          }
          // A backslash-escaped closing `$$` is not a real closer (texMath
          // rejects it too); fall through to `i++` and retry from a later
          // position rather than treating display math as exhausted.
        }
      } else if (!isMathWhitespace(markdown[i + 1])) {
        // `$…$` inline.
        const close = markdown.indexOf("$", i + 1);
        if (
          close > i + 1
          && !isMathWhitespace(markdown[close - 1])
          && markdown[close - 1] !== "\\"
          && !isAsciiDigit(markdown[close + 1])
        ) {
          spans.push({ start: i, end: close + 1, inline: true, equation: markdown.slice(i + 1, close).trim() });
          i = close + 1;
          continue;
        }
      }
    } else if (ch === "\\") {
      const next = markdown[i + 1];
      if (next === "(" && !parenExhausted) {
        const close = markdown.indexOf("\\)", i + 2);
        if (close >= 0) {
          spans.push({ start: i, end: close + 2, inline: true, equation: markdown.slice(i + 2, close).trim() });
          i = close + 2;
          continue;
        }
        parenExhausted = true;
      } else if (next === "[" && !bracketExhausted) {
        const close = markdown.indexOf("\\]", i + 2);
        if (close >= 0) {
          spans.push({ start: i, end: close + 2, inline: false, equation: markdown.slice(i + 2, close).trim() });
          i = close + 2;
          continue;
        }
        bracketExhausted = true;
      }
      // A backslash escapes the next character — skip the pair, so an escaped
      // `\$` is not read as a math opener (matching markdown-it's escape rule).
      i += 2;
      continue;
    }
    i++;
  }
  return spans;
}

/**
 * Strips math tokens where math must be treated as zero-width — projecting
 * markdown to the plain text that corresponds to the Lexical document, where
 * each equation is an opaque, zero-text-length MathNode.
 */
export function stripMathTokens(markdown: string): string {
  const spans = findMathSpansInMarkdown(markdown);
  if (spans.length === 0) return markdown;
  let result = "";
  let cursor = 0;
  for (const span of spans) {
    result += markdown.slice(cursor, span.start);
    cursor = span.end;
  }
  return result + markdown.slice(cursor);
}

/**
 * Whether wrapping `equation` in bare inline `$…$` delimiters round-trips —
 * i.e. `findMathSpansInMarkdown` recovers exactly that one equation. `$…$` is
 * fragile: an opening `$` may not be followed by whitespace, a closing `$`
 * may not be preceded by whitespace or a backslash nor followed by a digit,
 * and the body may not contain a `$`. `followingChar` is the character that
 * will sit immediately after the closing `$` in the output — the digit rule
 * depends on it, so callers that know the surrounding context should pass it.
 */
function inlineDollarFormRoundTrips(equation: string, followingChar?: string): boolean {
  const candidate = `$${equation}$${followingChar ?? ""}`;
  const spans = findMathSpansInMarkdown(candidate);
  return (
    spans.length > 0
    && spans[0].start === 0
    && spans[0].end === equation.length + 2
    && spans[0].inline
    && spans[0].equation === equation
  );
}

/**
 * Whether wrapping `equation` in display `$$…$$` delimiters round-trips.
 * `$$…$$` has none of the single-`$` fragilities and fails only if the body
 * itself contains a `$$`.
 */
function displayDollarFormRoundTrips(equation: string): boolean {
  const candidate = `$$\n${equation}\n$$`;
  const spans = findMathSpansInMarkdown(candidate);
  return (
    spans.length > 0
    && spans[0].start === 0
    && spans[0].end === candidate.length
    && !spans[0].inline
    && spans[0].equation === equation
  );
}

/**
 * Whether wrapping `equation` in `\(…\)` (inline) or `\[…\]` (display)
 * round-trips. These delimiters have a fixed closer with none of the bare-`$`
 * fragilities, but they still fail if the equation body literally contains
 * the closer sequence (`\)` resp. `\]`) — content that is not valid LaTeX
 * math anyway.
 */
function backslashFormRoundTrips(equation: string, inline: boolean): boolean {
  const candidate = inline ? `\\(${equation}\\)` : `\\[${equation}\\]`;
  const spans = findMathSpansInMarkdown(candidate);
  return (
    spans.length > 0
    && spans[0].start === 0
    && spans[0].end === candidate.length
    && spans[0].inline === inline
    && spans[0].equation === equation
  );
}

/**
 * Render a math token to its canonical agent-facing markdown. The preferred
 * form is bare `$…$` (inline) / `$$\n…\n$$` (display) — the form agents
 * expect — but when that form would not round-trip (an equation hostile to
 * the single-`$` rules, or an inline equation followed by a digit) it falls
 * back to `\(…\)` / `\[…\]`. Both candidate forms are verified against
 * `findMathSpansInMarkdown` before being chosen, so `formatMathToken` never
 * emits a token it cannot recover. If neither form round-trips — an equation
 * body hostile to the `$` rules that also contains the `\)` / `\]` closer,
 * which is not valid LaTeX math — it degrades to the conventional `$…$`
 * form rather than emit a `\(…\)` token already known to mis-scan.
 *
 * Pass `followingChar` (the char that will follow the token in the output)
 * when it is known, so the inline case can account for a following digit. The
 * equation is trimmed: LaTeX ignores edge whitespace, and
 * `findMathSpansInMarkdown` trims recovered span content, so trimming here
 * keeps `formatMathToken` and the scanner in agreement.
 */
export function formatMathToken({ equation, inline }: MathToken, followingChar?: string): string {
  const eq = equation.trim();
  if (inline) {
    if (inlineDollarFormRoundTrips(eq, followingChar)) return `$${eq}$`;
    if (backslashFormRoundTrips(eq, true)) return `\\(${eq}\\)`;
    return `$${eq}$`;
  }
  if (displayDollarFormRoundTrips(eq)) return `$$\n${eq}\n$$`;
  if (backslashFormRoundTrips(eq, false)) return `\\[${eq}\\]`;
  return `$$\n${eq}\n$$`;
}

/**
 * Rewrite every math token to its canonical form (`formatMathToken`), so the
 * compact `$$x^2$$`, expanded `$$\nx^2\n$$`, and `\[x^2\]` forms of one
 * equation all become identical. This is what lets the agent matcher compare
 * equations regardless of which delimiter shape an agent quoted.
 */
export function canonicalizeMathTokens(markdown: string): string {
  const spans = findMathSpansInMarkdown(markdown);
  if (spans.length === 0) return markdown;
  let result = "";
  let cursor = 0;
  for (const span of spans) {
    result += markdown.slice(cursor, span.start);
    // `markdown[span.end]` is the char immediately after the token (or
    // undefined at end of string), so a digit-adjacent equation canonicalizes
    // to the digit-safe `\(…\)` form rather than an unrecoverable `$…$5`.
    result += formatMathToken(span, markdown[span.end]);
    cursor = span.end;
  }
  return result + markdown.slice(cursor);
}

/**
 * Lower-case a markdown string for case-insensitive matching, but preserve the
 * case of math-token content: LaTeX is case-sensitive (`X` and `x`, `\Frac`
 * and `\frac` are different), so equations must match exactly.
 */
export function foldCaseOutsideMath(value: string): string {
  const spans = findMathSpansInMarkdown(value);
  if (spans.length === 0) return value.toLowerCase();
  let result = "";
  let cursor = 0;
  for (const span of spans) {
    result += value.slice(cursor, span.start).toLowerCase();
    result += value.slice(span.start, span.end);
    cursor = span.end;
  }
  return result + value.slice(cursor).toLowerCase();
}
