/**
 * Plugin for collapsible sections in Markdown. Modified from markdown-it-collapsible
 * by William Engelmann (https://github.com/Bioruebe/markdown-it-collapsible)
 * 
 * MIT License
 * 
 * Copyright (c) 2020 William Engelmann
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type MarkdownIt from "markdown-it";
import type { Renderer, StateBlock, Token } from "markdown-it";


const MARKER = 43; // +
const MARKER_OPEN = 62; // >

function skipMarker(state: StateBlock, start: number) {
  let isOpen = false;

  // First, skip all `+` characters
  let pos = state.skipChars(start, MARKER);
  
  // If the next character is `>`, then we are in open state
  if (state.src.charCodeAt(pos) === MARKER_OPEN) {
    pos++;
    isOpen = true;
  }

  const markerCount = pos - start;
  const marker = String.fromCharCode(MARKER).repeat(Math.max(markerCount - 1, 0)) + (isOpen ? ">" : "+");

  return { pos, isOpen, markerCount, marker };
}

/**
 * The core plugin which checks for the appropriate prefix content of
 * either `+++` (for collapsible blocks in closed state) or `++>` (for 
 * collapsible blocks in open state).
 */
function parseCollapsible(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
  let autoClosedBlock = false;
  let start = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  
  // The block must start with `+++` or `++>`
  let { pos, isOpen, markerCount, marker } = skipMarker(state, start);
  if (markerCount < 3) return false;

  /** The characters of the **summary** section */
  const params = state.src.slice(pos, max).trim();

  // Title must not be empty
  if (isWhitespace(state, pos, max)) return false;

  // The title must not end with the marker (no inline)
  if (params.endsWith(marker)) return false;

  // Since start is found, we can report success here in validation mode
  if (silent) return true;

  // Search the end of the block
  let nextLine = startLine;
  let isEmpty = true;

  for (;;) {
    nextLine++;

    // Unclosed block should be autoclosed by end of document.
    if (nextLine >= endLine) break;

    start = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    // Non-empty line with negative indent should stop the list:
    // - ```
    //  test
    if (start < max && state.sCount[nextLine] < state.blkIndent) break;

    if (state.src.charCodeAt(start) !== (MARKER)) {
      if (isEmpty) isEmpty = isWhitespace(state, start, max);
      continue;
    }

    // Closing marker should be indented less than 4 spaces
    if (state.sCount[nextLine] - state.blkIndent >= 4) continue;

    const endMarker = skipMarker(state, start);
    pos = endMarker.pos;

    // Closing marker must match opening marker
    if (endMarker.marker !== marker) continue;

    // Make sure tail has spaces only
    pos = state.skipSpaces(pos);

    if (pos < max) continue;

    autoClosedBlock = true;
    break;
  }

  if (isEmpty) return false;

  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = "reference";

  // This will prevent lazy continuations from ever going past our end marker
  state.lineMax = nextLine;

  // Push the tokens to the state
  let token = state.push("collapsible_open", "details", 1);
  token.block = true;
  token.info = params;
  token.markup = marker;
  token.map = [startLine, nextLine];
  if (isOpen) token.attrSet("open", "");

  // Tokenize the summary content
  let tokens: Token[] = [];
  /*const markerToken = new state.Token("collapsible_marker", "span", 1);
  markerToken.attrs = [["class", "details-marker"]];*/
  //const markerTokens = [markerToken, new state.Token("collapsible_marker", "span", -1)];
  const markerTokens = [new state.Token("collapsible_marker", "span", -1)];

  // It doesn't make sense to have block level elements inside the summary,
  // except for headings. Thus, a simple check is performed to see if the
  // summary content is a heading.
  if (params.match(/^#{1,6}/)) {
    tokens = state.md.parse(params, state.env);
    const headingToken = tokens.shift();
    if (headingToken) tokens.unshift(headingToken, ...markerTokens);
  }
  // Otherwise, we parse everything as inline
  else {
    state.md.inline.parse(params, state.md, state.env, tokens);
    tokens.unshift(...markerTokens);
  }

  token = state.push("collapsible_summary", "summary", 0);
  token.content = params;
  token.children = tokens;

  token = state.push("collapsible_contents", "div", 1);
  state.md.block.tokenize(state, startLine + 1, nextLine);
  token = state.push("collapsible_contents_close", "div", -1);

  token = state.push("collapsible_close", "details", -1);
  token.markup = state.src.slice(start, pos);
  token.block = true;

  state.parentType = oldParent;
  state.lineMax = oldLineMax;
  state.line = nextLine + (autoClosedBlock ? 1 : 0);

  return true;
}

function isWhitespace(state: StateBlock, start: number, end: number) {
  for (start; start < end; start++) {
    if (!state.md.utils.isWhiteSpace(state.src.charCodeAt(start))) return false;
  }
  return true;
}

/**
 * A markdown-it plugin, which allows authors to create a block of content, which can be toggled between
 * an open and closed state. Use `+++` to start in closed state and `++>` to render an open collapsible block by default.
 * 
 * @example
 * ```md
 * +++ Click to open
 * This content is
 * - hidden
 * - invisible
 * - collapsed
 * +++
 * ```
 */
export function markdownCollapsibleSections(md: MarkdownIt) {
  md.block.ruler.before("fence", "collapsible", parseCollapsible, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules.collapsible_open = function renderCollapsibleMarker(tokens: Token[], idx: number, options: any, env: any, self: Renderer) {
    return `<details class="detailsBlock">`
  }
  md.renderer.rules.collapsible_contents = function renderCollapsibleMarker(tokens: Token[], idx: number, options: any, env: any, self: Renderer) {
    return `<div class="detailsBlockContent">`
  }
  md.renderer.rules.collapsible_contents_close = function renderCollapsibleMarker(tokens: Token[], idx: number, options: any, env: any, self: Renderer) {
    return `</div>`
  }
  md.renderer.rules.collapsible_summary = function renderSummary(tokens: Token[], idx: number, options: any, env: any, self: Renderer) {
    const title = self.render(tokens[idx].children!, options, env);
    return `<summary class="detailsBlockTitle">${title}</summary>`;
  }
};
