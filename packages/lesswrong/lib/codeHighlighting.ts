/**
 * Shared syntax highlighting infrastructure using the CSS Custom Highlights
 * API. Used by both the Lexical editor (CodeHighlightCSSPlugin) and the
 * published content renderer (ContentItemBody) so that code blocks look
 * identical in both contexts.
 *
 * The module manages a global set of Highlight registrations. Multiple
 * "contexts" (editor instances, rendered post bodies, etc.) can each
 * contribute highlight ranges. When any context updates or unmounts, the
 * global CSS.highlights entries are rebuilt from all remaining contexts.
 */

import { defineStyles } from '@/components/hooks/useStyles';

// ---------------------------------------------------------------------------
// Prism types (no @types/prismjs in this project)
// ---------------------------------------------------------------------------

export interface PrismToken {
  type: string;
  content: string | PrismToken | Array<string | PrismToken>;
  alias?: string | string[];
}

interface PrismLib {
  languages: Record<string, unknown>;
  tokenize(code: string, grammar: unknown): Array<string | PrismToken>;
}

export function getPrism(): PrismLib | null {
  if (typeof globalThis === 'undefined') return null;
  return (globalThis as Record<string, unknown>).Prism as PrismLib | null;
}

// ---------------------------------------------------------------------------
// CSS Custom Highlights API types (not yet in TypeScript's lib)
// ---------------------------------------------------------------------------

interface CSSHighlightsAPI {
  highlights: Map<string, Highlight>;
}

declare class Highlight {
  constructor(...ranges: Range[]);
}

export function getHighlights(): Map<string, Highlight> | null {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) {
    return null;
  }
  return (CSS as unknown as CSSHighlightsAPI).highlights;
}

// ---------------------------------------------------------------------------
// Token type → highlight group mapping
// ---------------------------------------------------------------------------

const TOKEN_TO_HIGHLIGHT_GROUP: Record<string, string> = {
  atrule: 'attr',
  attr: 'attr',
  keyword: 'attr',
  boolean: 'property',
  constant: 'property',
  number: 'property',
  property: 'property',
  symbol: 'property',
  tag: 'property',
  builtin: 'selector',
  char: 'selector',
  selector: 'selector',
  string: 'selector',
  cdata: 'comment',
  comment: 'comment',
  doctype: 'comment',
  prolog: 'comment',
  entity: 'operator',
  operator: 'operator',
  url: 'operator',
  'class-name': 'function',
  class: 'function',
  function: 'function',
  important: 'variable',
  namespace: 'variable',
  regex: 'variable',
  variable: 'variable',
  punctuation: 'punctuation',
  deleted: 'deleted',
  inserted: 'inserted',
};

const ALL_HIGHLIGHT_GROUPS = new Set(Object.values(TOKEN_TO_HIGHLIGHT_GROUP));

const HIGHLIGHT_PREFIX = 'code-hl-';

// ---------------------------------------------------------------------------
// Styles (::highlight pseudo-elements)
// ---------------------------------------------------------------------------

export const codeHighlightStyles = defineStyles('CodeHighlightCSS', (theme: ThemeType) => ({
  '@global': {
    [`::highlight(${HIGHLIGHT_PREFIX}comment)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenComment,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}punctuation)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenPunctuation,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}property)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenProperty,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}selector)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenSelector,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}operator)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenOperator,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}attr)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenAttr,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}variable)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenVariable,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}function)`]: {
      color: theme.palette.lexicalEditor.codeHighlight.tokenFunction,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}deleted)`]: {
      backgroundColor: theme.palette.lexicalEditor.codeHighlight.hlDeletedBg,
    },
    [`::highlight(${HIGHLIGHT_PREFIX}inserted)`]: {
      backgroundColor: theme.palette.lexicalEditor.codeHighlight.hlInsertedBg,
    },
  },
}));

interface TextNodeEntry {
  node: Text;
  start: number;
  end: number;
}

interface CodeBlockTextData {
  codeText: string;
  textEntries: TextNodeEntry[];
}

/**
 * Walk a code block's DOM to build both the text for Prism (including \n for
 * <br> elements) and a map of DOM Text nodes to character offsets within that
 * text.
 */
function collectCodeBlockText(element: HTMLElement): CodeBlockTextData {
  const parts: string[] = [];
  const textEntries: TextNodeEntry[] = [];
  let offset = 0;

  function walk(node: Node): void {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const text = (child as Text).data;
        textEntries.push({ node: child as Text, start: offset, end: offset + text.length });
        parts.push(text);
        offset += text.length;
      } else if (child instanceof HTMLElement) {
        if (child.tagName === 'BR') {
          parts.push('\n');
          offset += 1;
        } else {
          walk(child);
        }
      }
    }
  }

  walk(element);
  return { codeText: parts.join(''), textEntries };
}

/**
 * Mutable cursor for createRange — allows amortized O(N+T) scanning when
 * tokens are emitted in document order (which Prism guarantees).
 */
interface RangeCursor {
  index: number;
}

function createRange(
  textNodes: TextNodeEntry[],
  start: number,
  end: number,
  cursor: RangeCursor,
): Range | null {
  if (start >= end || textNodes.length === 0) {
    return null;
  }

  let startEntry: TextNodeEntry | null = null;
  let endEntry: TextNodeEntry | null = null;

  for (let i = cursor.index; i < textNodes.length; i++) {
    const entry = textNodes[i];
    if (!startEntry && entry.end > start) {
      startEntry = entry;
      cursor.index = i;
    }
    if (entry.end >= end) {
      endEntry = entry;
      break;
    }
  }

  if (!startEntry || !endEntry) {
    return null;
  }

  try {
    const range = new Range();
    range.setStart(startEntry.node, Math.max(0, start - startEntry.start));
    range.setEnd(endEntry.node, Math.min(endEntry.node.length, end - endEntry.start));
    return range;
  } catch {
    return null;
  }
}

type TokenCallback = (text: string, type: string | undefined) => void;

function walkTokens(
  tokens: Array<string | PrismToken>,
  callback: TokenCallback,
  parentType?: string,
): void {
  for (const token of tokens) {
    if (typeof token === 'string') {
      callback(token, parentType);
    } else {
      const tokenType =
        token.type === 'prefix' && typeof token.alias === 'string'
          ? token.alias
          : token.type;
      const effectiveType = token.type === 'unchanged' ? undefined : tokenType;
      if (typeof token.content === 'string') {
        callback(token.content, effectiveType ?? parentType);
      } else if (Array.isArray(token.content)) {
        walkTokens(token.content, callback, effectiveType ?? parentType);
      }
    }
  }
}

/**
 * Run Prism tokenization on a code block element and collect highlight ranges
 * grouped by token type.
 */
export function highlightCodeElement(
  element: HTMLElement,
  language: string | undefined,
  rangesByGroup: Map<string, Range[]>,
): void {
  const Prism = getPrism();
  if (!Prism) return;

  const { codeText, textEntries } = collectCodeBlockText(element);
  if (codeText.length === 0 || textEntries.length === 0) return;

  const lang = language || 'javascript';
  const grammar = Prism.languages[lang];
  if (!grammar) return;

  const tokens = Prism.tokenize(codeText, grammar);

  let charOffset = 0;
  const cursor: RangeCursor = { index: 0 };
  walkTokens(tokens, (text, type) => {
    if (type) {
      const group = TOKEN_TO_HIGHLIGHT_GROUP[type] || type;
      if (ALL_HIGHLIGHT_GROUPS.has(group)) {
        const range = createRange(textEntries, charOffset, charOffset + text.length, cursor);
        if (range) {
          let ranges = rangesByGroup.get(group);
          if (!ranges) {
            ranges = [];
            rangesByGroup.set(group, ranges);
          }
          ranges.push(range);
        }
      }
    }
    charOffset += text.length;
  });
}

// ---------------------------------------------------------------------------
// Global highlight context manager
//
// Multiple consumers (editor plugin, published content, etc.) can each
// register their own highlight ranges under a unique context ID. When any
// context updates, the global CSS.highlights entries are rebuilt from all
// active contexts.
// ---------------------------------------------------------------------------

const rangesByContext = new Map<string, Map<string, Range[]>>();

function rebuildHighlights(): void {
  const highlights = getHighlights();
  if (!highlights) return;

  for (const group of ALL_HIGHLIGHT_GROUPS) {
    const name = HIGHLIGHT_PREFIX + group;
    const allRanges: Range[] = [];
    for (const [, contextRanges] of rangesByContext) {
      const groupRanges = contextRanges.get(group);
      if (groupRanges) {
        allRanges.push(...groupRanges);
      }
    }
    if (allRanges.length > 0) {
      highlights.set(name, new Highlight(...allRanges));
    } else {
      highlights.delete(name);
    }
  }
}

/** Update the highlight ranges for a given context and rebuild global highlights. */
export function updateHighlightContext(
  contextId: string,
  ranges: Map<string, Range[]>,
): void {
  rangesByContext.set(contextId, ranges);
  rebuildHighlights();
}

/** Remove a context's highlight ranges and rebuild global highlights. */
export function removeHighlightContext(contextId: string): void {
  rangesByContext.delete(contextId);
  rebuildHighlights();
}
