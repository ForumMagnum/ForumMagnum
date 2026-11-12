/**
 * Makes linkification see bare URLs with their markdown backslash escapes
 * resolved, the way markdown-it 12 did.
 *
 * markdown-it 13 moved linkification of scheme URLs (`https://…`) into an
 * inline rule that matches against the raw source, and keeps escaped
 * characters in separate `text_special` tokens until after the core (fuzzy,
 * `www.…`) linkify rule has run. Without this plugin, a bare URL written with
 * escapes, like `https://en.wikipedia.org/wiki/Foo\_bar` (a common workaround
 * for markdown-it 12 treating underscores in URLs as emphasis, and what
 * Turndown produces for URLs in plain text), links to `Foo%5C_bar`, and
 * `www.example.com/foo\_bar` links only to `www.example.com/foo`.
 *
 * `linkifyResolvingEscapes` is adapted from markdown-it's
 * `lib/rules_inline/linkify.mjs` (https://github.com/markdown-it/markdown-it):
 *
 * Copyright (c) 2014 Vitaly Puzrin, Alex Kocharin.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
import type MarkdownIt from "markdown-it";
import type { StateCore, StateInline, Token } from "markdown-it/index.js";

function isAsciiAlpha(code: number): boolean {
  return (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
}

// RFC3986: scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
function isSchemeChar(code: number): boolean {
  return isAsciiAlpha(code) || (code >= 0x30 && code <= 0x39) || code === 0x2B || code === 0x2D || code === 0x2E;
}

// Whether `str.slice(0, end)` ends with an odd number of backslashes, ie with
// a backslash that escapes whatever comes after it.
function endsWithUnpairedBackslash(str: string, end: number): boolean {
  let count = 0;
  while (count < end && str.charCodeAt(end - 1 - count) === 0x5C /* \ */) {
    count++;
  }
  return count % 2 === 1;
}

/**
 * markdown-it's inline `linkify` rule, except that backslash escapes in the
 * matched URL are resolved before it becomes the link's href and text.
 */
function linkifyResolvingEscapes(state: StateInline, silent: boolean): boolean {
  if (!state.md.options.linkify) return false;
  // `linkLevel` (nonzero while parsing a link's label) is missing from @types/markdown-it
  if ("linkLevel" in state && typeof state.linkLevel === "number" && state.linkLevel > 0) return false;

  const pos = state.pos;
  const max = state.posMax;

  if (pos + 3 > max) return false;
  if (state.src.charCodeAt(pos) !== 0x3A /* : */) return false;
  if (state.src.charCodeAt(pos + 1) !== 0x2F /* / */) return false;
  if (state.src.charCodeAt(pos + 2) !== 0x2F /* / */) return false;

  // Search backwards for the scheme, but no more than 10 characters, the length
  // of the pending string, or the length of the source prefix.
  const protoMin = pos - Math.min(10, state.pending.length, pos);
  let protoStart = pos;
  while (protoStart > protoMin && isSchemeChar(state.src.charCodeAt(protoStart - 1))) {
    protoStart--;
  }

  if (protoStart === pos || !isAsciiAlpha(state.src.charCodeAt(protoStart))) return false;

  const protoLength = pos - protoStart;

  const link = state.md.linkify.matchAtStart(state.src.slice(protoStart));
  if (!link) return false;

  // Trim '*'s off the end of the link (they conflict with emphasis), and a
  // backslash that would escape the character after the link.
  let urlEnd = link.url.length;
  for (;;) {
    if (urlEnd > 0 && link.url.charCodeAt(urlEnd - 1) === 0x2A /* * */) {
      urlEnd--;
    } else if (endsWithUnpairedBackslash(link.url, urlEnd)) {
      urlEnd--;
    } else {
      break;
    }
  }

  // Invalid link, but still detected by linkify somehow; need to check to
  // prevent an infinite loop below.
  if (urlEnd <= protoLength) return false;

  const rawUrl = link.url.slice(0, urlEnd);
  const url = state.md.utils.unescapeMd(rawUrl);
  const fullUrl = state.md.normalizeLink(url);
  if (!state.md.validateLink(fullUrl)) return false;

  if (!silent) {
    state.pending = state.pending.slice(0, -protoLength);

    const tokenOpen = state.push("link_open", "a", 1);
    tokenOpen.attrs = [["href", fullUrl]];
    tokenOpen.markup = "linkify";
    tokenOpen.info = "auto";

    const tokenText = state.push("text", "", 0);
    tokenText.content = state.md.normalizeLinkText(url);

    const tokenClose = state.push("link_close", "a", -1);
    tokenClose.markup = "linkify";
    tokenClose.info = "auto";
  }

  state.pos += rawUrl.length - protoLength;
  return true;
}

/**
 * Merges escaped characters (`text_special` tokens) into the surrounding text
 * before the core `linkify` rule runs, rather than after it as markdown-it's
 * `text_join` rule does, so that fuzzy links aren't cut off at an escape.
 */
function joinEscapedText(state: StateCore): void {
  for (const blockToken of state.tokens) {
    if (blockToken.type !== "inline" || !blockToken.children) continue;

    const joined: Token[] = [];
    for (const token of blockToken.children) {
      if (token.type === "text_special") {
        token.type = "text";
      }
      const previous = joined[joined.length - 1];
      if (token.type === "text" && previous?.type === "text") {
        previous.content += token.content;
      } else {
        joined.push(token);
      }
    }
    blockToken.children = joined;
  }
}

export function markdownLinkifyEscapes(md: MarkdownIt): void {
  md.inline.ruler.at("linkify", linkifyResolvingEscapes);
  md.core.ruler.before("linkify", "join_escaped_text", joinEscapedText);
}
