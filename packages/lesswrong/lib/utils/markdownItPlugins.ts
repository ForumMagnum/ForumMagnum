import markdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import markdownItSub from "markdown-it-sub";
import markdownItSup from "markdown-it-sup";
import type { Renderer, StateBlock, Token } from "markdown-it/index.js";
import markdownItMathjax from './markdownMathjax';
import { markdownCollapsibleSections } from './markdownCollapsibleSections';

const llmOutputOpenRegex = /^%%%[ \t]+llm-output(?:[ \t]+model="([^"]*)")?[ \t]*$/;
const llmOutputCloseRegex = /^%%%[ \t]+\/llm-output[ \t]*$/;

function parseLlmOutputBlock(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
  let start = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  const openLine = state.src.slice(start, max).trim();
  const openMatch = openLine.match(llmOutputOpenRegex);
  if (!openMatch) {
    return false;
  }

  if (silent) {
    return true;
  }

  const modelName = openMatch[1] ?? '';
  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  let nextLine = startLine;
  let autoClosedBlock = false;

  state.parentType = "reference";

  for (;;) {
    nextLine++;

    if (nextLine >= endLine) {
      break;
    }

    start = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (start < max && state.sCount[nextLine] < state.blkIndent) {
      break;
    }

    const line = state.src.slice(start, max).trim();
    if (!llmOutputCloseRegex.test(line)) {
      continue;
    }

    autoClosedBlock = true;
    break;
  }

  state.lineMax = nextLine;

  let token = state.push("llm_output_open", "div", 1);
  token.block = true;
  token.map = [startLine, nextLine];
  token.attrSet("class", "llm-content-block");
  token.attrSet("data-model-name", modelName);

  token = state.push("llm_output_content_open", "div", 1);
  token.block = true;
  token.attrSet("class", "llm-content-block-content");

  state.md.block.tokenize(state, startLine + 1, nextLine);

  token = state.push("llm_output_content_close", "div", -1);
  token.block = true;

  token = state.push("llm_output_close", "div", -1);
  token.block = true;

  state.parentType = oldParent;
  state.lineMax = oldLineMax;
  state.line = nextLine + (autoClosedBlock ? 1 : 0);

  return true;
}

function markdownLlmContentBlocks(md: markdownIt) {
  md.block.ruler.before("fence", "llm_output", parseLlmOutputBlock, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  const renderToken = (tokens: Token[], idx: number, options: AnyBecauseHard, _env: AnyBecauseHard, self: Renderer) =>
    self.renderToken(tokens, idx, options);

  md.renderer.rules.llm_output_open = renderToken;
  md.renderer.rules.llm_output_content_open = renderToken;
  md.renderer.rules.llm_output_content_close = renderToken;
  md.renderer.rules.llm_output_close = renderToken;
}

// Block rule for spoiler markdown (`>!` line prefix), modeled after the
// blockquote rule. Each line of a spoiler block starts with `>!`. Consecutive
// `>!` lines form one spoiler block; a non-`>!` line ends it. Inside, the
// content (with prefixes stripped) is re-parsed as markdown so inline
// formatting and paragraph breaks (a bare `>!` line) work as expected.
//
// Renders as `<div class="spoilers">…</div>` — the canonical class that
// Lexical's SpoilerNode and the rendering CSS recognize.
function parseSpoilerBlock(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  const lineStart = state.bMarks[startLine] + state.tShift[startLine];
  // 4-space indent → code block, not spoiler
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  // Must start with `>!`
  if (state.src.charCodeAt(lineStart) !== 0x3E /* > */) return false;
  if (state.src.charCodeAt(lineStart + 1) !== 0x21 /* ! */) return false;

  if (silent) return true;

  const innerLines: string[] = [];
  let nextLine = startLine;
  while (nextLine < endLine) {
    const ls = state.bMarks[nextLine] + state.tShift[nextLine];
    const lm = state.eMarks[nextLine];
    if (state.sCount[nextLine] - state.blkIndent >= 4) break;
    if (state.src.charCodeAt(ls) !== 0x3E) break;
    if (state.src.charCodeAt(ls + 1) !== 0x21) break;

    // Strip `>!` plus an optional single space (parallels blockquote's `>`+space).
    let contentStart = ls + 2;
    if (contentStart < lm && state.src.charCodeAt(contentStart) === 0x20) {
      contentStart++;
    }
    innerLines.push(state.src.slice(contentStart, lm));
    nextLine++;
  }

  let token = state.push("spoiler_block_open", "div", 1);
  token.block = true;
  token.map = [startLine, nextLine];
  token.attrSet("class", "spoilers");

  // Parse the prefix-stripped content as fresh markdown, appending child
  // tokens to the current token stream.
  state.md.block.parse(innerLines.join("\n"), state.md, state.env, state.tokens);

  token = state.push("spoiler_block_close", "div", -1);
  token.block = true;

  state.line = nextLine;
  return true;
}

function markdownSpoilerBlocks(md: markdownIt) {
  md.block.ruler.before("blockquote", "spoiler_block", parseSpoilerBlock, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  const renderToken = (tokens: Token[], idx: number, options: AnyBecauseHard, _env: AnyBecauseHard, self: Renderer) =>
    self.renderToken(tokens, idx, options);

  md.renderer.rules.spoiler_block_open = renderToken;
  md.renderer.rules.spoiler_block_close = renderToken;
}

let _mdi: markdownIt|null = null;
export function getMarkdownIt(): markdownIt {
  if (!_mdi) {
    const mdi = markdownIt({linkify: true})
    mdi.use(markdownItMathjax())
    mdi.use(markdownLlmContentBlocks)
    mdi.use(markdownSpoilerBlocks)
    mdi.use(markdownItContainer as AnyBecauseHard, 'spoiler')
    mdi.use(markdownItFootnote as any)
    applyMarkdownFootnoteRules(mdi);
    mdi.use(markdownItSub)
    mdi.use(markdownItSup)
    mdi.use(markdownCollapsibleSections);
    _mdi = mdi;
  }
  return _mdi;
}

let _mdiNoMathjax: markdownIt|null = null;
export function getMarkdownItNoMathjax(): markdownIt {
  if (!_mdiNoMathjax) {
    // FIXME This is a copy-paste of a markdown config from conversionUtils that has gotten out of sync
    const mdi = markdownIt({ linkify: true });
    // mdi.use(markdownItMathjax()) // for performance, don't render mathjax
    mdi.use(markdownLlmContentBlocks);
    mdi.use(markdownSpoilerBlocks);
    mdi.use(markdownItContainer as AnyBecauseHard, "spoiler");
    mdi.use(markdownItFootnote as any);
    applyMarkdownFootnoteRules(mdi);
    mdi.use(markdownItSub);
    mdi.use(markdownItSup);
    _mdiNoMathjax = mdi;
  }
  return _mdiNoMathjax;
}

let _mdiArbital: markdownIt|null = null;
export function getMarkdownItArbital(): markdownIt {
  if (!_mdiArbital) {
    const mdi = markdownIt({linkify: true})
    mdi.use(markdownItMathjax())
    _mdiArbital = mdi;
  }
  return _mdiArbital;
}

let _mdiNoPlugins: markdownIt|null = null;
export function getMarkdownItNoPlugins(): markdownIt {
  if (!_mdiNoPlugins) {
    const mdi = markdownIt({linkify: true})
    _mdiNoPlugins = mdi;
  }
  return _mdiNoPlugins;
}


function applyMarkdownFootnoteRules(mdi: markdownIt) {
  // These rules were generated by starting from the rules in the source of
  // markdown-it-footnote (https://github.com/markdown-it/markdown-it-footnote/blob/master/index.mjs)
  // and modifying until they matched the classnames and format of our CkEditor
  // footnote plugin.
  mdi.renderer.rules.footnote_ref = (tokens, idx, options, env, self) => {
    const id = self.rules.footnote_anchor_name!(tokens, idx, options, env, self)
    const caption = self.rules.footnote_caption!(tokens, idx, options, env, self)
    let refid = id
  
    if (tokens[idx].meta.subId > 0) refid += `:${tokens[idx].meta.subId}`
  
    // The markdown-it-footnote default here was:
    //return `<sup class="footnote-ref"><a href="#fn${id}" id="fnref${refid}">${caption}</a></sup>`

    const footnoteIndex = Number(tokens[idx].meta.id + 1).toString()
    return `<span data-footnote-reference="" data-footnote-index="${footnoteIndex}" data-footnote-id="${id}" role="doc-noteref" id="fnref${id}" class="footnote-reference">
      <sup><a href="#fn${id}" class="">${caption}</a></sup>
    </span>`
  };
  mdi.renderer.rules.footnote_block_open = (tokens, idx, options) => {
    // The markdown-it-footnote default here was:
    //return (options.xhtmlOut ? '<hr class="footnotes-sep" />\n' : '<hr class="footnotes-sep">\n') +
    //  '<section class="footnotes">\n' +
    //  '<ol class="footnotes-list">\n'

    return '<ol data-footnote-section="" role="doc-endnotes" class="footnote-section footnotes">';
  };
  mdi.renderer.rules.footnote_block_close = () => {
    // The markdown-it-footnote default here was:
    //return '</ol>\n</section>\n'

    return '</ol>\n'
  };
  mdi.renderer.rules.footnote_open = (tokens, idx, options, env, self) => {
    let id = self.rules.footnote_anchor_name!(tokens, idx, options, env, self)

    if (tokens[idx].meta.subId > 0) id += `:${tokens[idx].meta.subId}`
  
    // The markdown-it-footnote default here was:
    //return `<li id="fn${id}" class="footnote-item">`
    const footnoteIndex = Number(tokens[idx].meta.id + 1).toString()
    return `<li data-footnote-item="" data-footnote-index="${footnoteIndex}" data-footnote-id="${id}" id="fn${id}" role="doc-endnote" class="footnote-item">`
  };
  mdi.renderer.rules.footnote_close = () => {
    return '</li>\n'
  };
  mdi.renderer.rules.footnote_anchor = (tokens, idx, options, env, self) => {
    let id = self.rules.footnote_anchor_name!(tokens, idx, options, env, self)
  
    if (tokens[idx].meta.subId > 0) id += `:${tokens[idx].meta.subId}`
  
    /* ↩ with escape code to prevent display as Apple Emoji on iOS */
    return ` <a href="#fnref${id}" class="footnote-backref">\u21a9\uFE0E</a>`
  };
  mdi.renderer.rules.footnote_anchor_name = (tokens, idx, options, env) => {
    const n = Number(tokens[idx].meta.id + 1).toString()
    let prefix = ''
  
    if (typeof env.docId === 'string') prefix = `-${env.docId}-`
  
    return prefix + n
  };
  mdi.renderer.rules.footnote_caption = (tokens, idx, options, env) => {
    let n = Number(tokens[idx].meta.id + 1).toString()
    if (tokens[idx].meta.subId > 0) n += `:${tokens[idx].meta.subId}`
    return `[${n}]`
  };
}
