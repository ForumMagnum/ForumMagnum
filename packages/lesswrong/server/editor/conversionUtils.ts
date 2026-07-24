import { randomId } from '../../lib/random';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../draftConvert';
import { captureException } from '@/lib/sentryWrapper';
import type TurndownService from 'turndown';
import { isAnyTest } from '../../lib/executionEnvironment';
import { cheerioParse } from '../utils/htmlUtil';
import { sanitize } from "@/lib/utils/sanitize";
import { filterWhereFieldsNotNull } from '../../lib/utils/typeGuardUtils';
import { getMarkdownIt, getMarkdownItNoMathjax } from '@/lib/utils/markdownItPlugins';
import { formatMathToken } from '@/lib/utils/mathTokens';
import type { Cheerio, CheerioAPI, Element as CheerioElement } from 'cheerio';
import type { DataNode } from 'domhandler';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { CHTML } from 'mathjax-full/js/output/chtml.js';
import { type LiteAdaptor, liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AssistiveMmlHandler } from 'mathjax-full/js/a11y/assistive-mml.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { type LiteElement } from 'mathjax-full/js/adaptors/lite/Element';
import IframeWidgetSrcdocs from '@/server/collections/iframeWidgetSrcdocs/collection';
import { ServerSafeNode } from '@/lib/domParser';
import {
  formatMentionToken,
  isMentionKind,
  MENTION_DOM_CLASS,
} from '@/components/research/lexical/mentionFormat';
import {
  QUERY_INPUT_DOM_CLASS,
  QUERY_INPUT_BASE_ENVIRONMENT_ATTR,
  QUERY_INPUT_RUNTIME_ATTR,
} from '@/components/research/lexical/QueryInputNode';

function escapeMarkerAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const blockTags = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DIV', 'DL', 'DT', 'DD', 'FIELDSET',
  'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'NOSCRIPT', 'OL', 'P', 'PRE', 'SECTION',
  'TABLE', 'TFOOT', 'UL',
]);

const isBlockTag = (nodeName: string): boolean => blockTags.has(nodeName);

/**
 * The character that immediately follows `node` in document order, ascending
 * out of inline wrappers. `node.nextSibling` alone is null when a math-tex
 * span is the last child of an inline element (a styled `<span>`, an `<a>`,
 * …), which would miss a following digit. Ascent stops at the enclosing
 * block: a digit that starts the next block cannot fuse with this equation's
 * closing `$`, so the bare `$…$` form stays safe across a block boundary.
 */
function firstCharFollowingNode(node: Node): string | undefined {
  let current: Node | null = node;
  while (current) {
    for (let sibling = current.nextSibling; sibling; sibling = sibling.nextSibling) {
      const text = sibling.textContent;
      if (text && text.length > 0) {
        return text[0];
      }
    }
    const parent: Node | null = current.parentNode;
    if (!parent || (parent.nodeType === ServerSafeNode.ELEMENT_NODE && isBlockTag(parent.nodeName))) {
      return undefined;
    }
    current = parent;
  }
  return undefined;
}

/** Mirror of `firstCharFollowingNode`: the character immediately preceding `node`. */
function lastCharPrecedingNode(node: Node): string | undefined {
  let current: Node | null = node;
  while (current) {
    for (let sibling = current.previousSibling; sibling; sibling = sibling.previousSibling) {
      const text = sibling.textContent;
      if (text && text.length > 0) {
        return text[text.length - 1];
      }
    }
    const parent: Node | null = current.parentNode;
    if (!parent || (parent.nodeType === ServerSafeNode.ELEMENT_NODE && isBlockTag(parent.nodeName))) {
      return undefined;
    }
    current = parent;
  }
  return undefined;
}

// CommonMark's punctuation set, used by its emphasis flanking rules: the
// Unicode P and S general categories (the spec's "Unicode punctuation
// character"). ASCII-only matching here would emit unparseable emphasis next
// to curly quotes and other typographic punctuation.
const COMMONMARK_PUNCTUATION = /[\p{P}\p{S}]/u;

const isFlankingWhitespaceOrBoundary = (ch: string | undefined): boolean =>
  ch === undefined || /\s/.test(ch);

/**
 * Emphasis replacement that only emits delimiters CommonMark can parse back.
 *
 * A delimiter run can open emphasis only if it is left-flanking: not followed
 * by whitespace, and not followed by punctuation unless preceded by
 * whitespace/punctuation (mirrored for closing). Emitting markers that
 * violate this — e.g. `boundaries**.**` for `boundaries<b>.</b>` — produces
 * literal asterisks in the rendered output, corrupting the text. In that
 * case the content is emitted unwrapped: dropping the formatting is the
 * faithful-text choice, and there is no valid markdown spelling anyway.
 */
function flankingAwareEmphasis(marker: string): (content: string, node: Node) => string {
  return (content, node) => {
    const match = content.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const leading = match?.[1] ?? '';
    const core = match?.[2] ?? content;
    const trailing = match?.[3] ?? '';
    if (!core) return content;

    // Turndown relocates the element's edge whitespace outside the
    // replacement, so when the node's own text had it, the effective
    // neighbor character is a space.
    const nodeText = node.textContent ?? '';
    const charBefore = /^\s/.test(nodeText) ? ' ' : lastCharPrecedingNode(node);
    const charAfter = /\s$/.test(nodeText) ? ' ' : firstCharFollowingNode(node);

    const canOpen = !COMMONMARK_PUNCTUATION.test(core[0])
      || isFlankingWhitespaceOrBoundary(charBefore)
      || COMMONMARK_PUNCTUATION.test(charBefore ?? '');
    const canClose = !COMMONMARK_PUNCTUATION.test(core[core.length - 1])
      || isFlankingWhitespaceOrBoundary(charAfter)
      || COMMONMARK_PUNCTUATION.test(charAfter ?? '');
    if (!canOpen || !canClose) {
      return leading + core + trailing;
    }
    return `${leading}${marker}${core}${marker}${trailing}`;
  };
}

function isLexicalIframeWidgetElement(node: Node): node is Element {
  if (node?.nodeType !== ServerSafeNode.ELEMENT_NODE) {
    return false;
  }
  const element = node as Element;
  return element.nodeName.toUpperCase() === 'IFRAME'
    && element.getAttribute('data-lexical-iframe-widget') !== null;
}

function iframeWidgetElementToMarkdown(element: Element): string {
  const widgetId = element.getAttribute('data-widget-id') ?? '';
  const widgetMarkup = element.getAttribute('srcdoc') ?? '';
  return `\n\n\`\`\`widget[${widgetId}]\n${widgetMarkup}\n\`\`\`\n\n`;
}

// Strip the srcdoc attribute from iframe widgets. Iframe-widget srcdocs contain HTML
// markup and an injected resize script, none of which is user-authored prose; leaving
// them in inflates word-count estimates (and similar markdown-derived analyses) by
// hundreds or thousands of tokens per widget.
function stripIframeWidgetSrcdocs(html: string): string {
  if (!html.includes('data-lexical-iframe-widget')) {
    return html;
  }
  const $ = cheerioParse(html);
  $('iframe[data-lexical-iframe-widget]').removeAttr('srcdoc');
  return $.html();
}

let _turndownService: TurndownService|null = null;
const TURNDOWN_BUILD_MARKER = 'widget-markdown-v7-singleline-links';
function getTurndown(): TurndownService {
  const cachedMarker = (_turndownService as AnyBecauseHard | null)?.__buildMarker;
  if (!_turndownService || cachedMarker !== TURNDOWN_BUILD_MARKER) {
    const TurndownService: typeof import('turndown') = require('turndown');
    const {gfm} = require('@truto/turndown-plugin-gfm');

    const indentMarkdown = (markdown: string, indentLevel: number): string => {
      if (indentLevel <= 0) return markdown;
      const prefix = "\t".repeat(indentLevel);
      return markdown
        .split("\n")
        .map((line) => (line.length ? `${prefix}${line}` : line))
        .join("\n");
    };

    const turndownService = new TurndownService({
      blankReplacement: (content: string, node: Node) => {
        if (isLexicalIframeWidgetElement(node)) {
          return iframeWidgetElementToMarkdown(node);
        }
        if (hasDataMarkdownAttribute(node)) {
          const element = node as Element;
          const markdown = element.getAttribute('data-markdown') ?? '';
          const indentLevel = Number.parseInt(element.getAttribute('data-indent-level') ?? "0", 10) || 0;
          const indentedMarkdown = indentMarkdown(unescape(markdown), indentLevel);
          return `\n\n${indentedMarkdown}\n\n`
        }
        if (node?.nodeType === ServerSafeNode.ELEMENT_NODE && isBlockTag(node.nodeName)) {
          return '\n\n'
        }
        // For an inline element whose only content is non-ASCII whitespace
        // (e.g. <i><span>&nbsp;</span></i> produced by Lexical when a user
        // italicizes a single space), Turndown's flankingWhitespace pass
        // doesn't see the whitespace (it only matches [ \r\n\t]), so the
        // entire element collapses to "" — joining the surrounding words
        // together. Return the textContent so the whitespace survives.
        if (node?.nodeType === ServerSafeNode.ELEMENT_NODE) {
          const text = (node as Element).textContent ?? '';
          if (text && /^\s+$/.test(text) && !/^[ \r\n\t\f\v]+$/.test(text)) {
            return text;
          }
        }
        return ''
      },
    })
    turndownService.addRule('iframe-widget-markdown', {
      filter: ['iframe'],
      replacement: (_content, node) => {
        const element = node as Element;
        if (element.getAttribute('data-lexical-iframe-widget') === null) {
          return element.outerHTML;
        }
        return iframeWidgetElementToMarkdown(element);
      }
    })
    turndownService.addRule('llm-content-block', {
      filter: (node) =>
        node.nodeName === 'DIV' && !!node.classList?.contains('llm-content-block'),
      replacement: (content, node) => {
        const element = node as Element;
        const modelName = element.getAttribute('data-model-name') || 'unknown model';
        const trimmed = content.trim();
        return `\n\n%%% llm-output model="${modelName}"\n\n${trimmed}\n\n%%% /llm-output\n\n`;
      },
    })
    turndownService.addRule('research-query-input', {
      filter: (node) =>
        node.nodeName === 'DIV' && !!node.classList?.contains(QUERY_INPUT_DOM_CLASS),
      replacement: (content, node) => {
        const element = node as Element;
        const baseEnvironmentId = element.getAttribute(QUERY_INPUT_BASE_ENVIRONMENT_ATTR);
        const runtime = element.getAttribute(QUERY_INPUT_RUNTIME_ATTR);
        const attrSuffix =
          (baseEnvironmentId ? ` baseEnvironmentId="${escapeMarkerAttr(baseEnvironmentId)}"` : '') +
          (runtime ? ` runtime="${escapeMarkerAttr(runtime)}"` : '');
        const trimmed = content.trim();
        return `\n\n%%% query-input${attrSuffix}\n\n${trimmed}\n\n%%% /query-input\n\n`;
      },
    })
    turndownService.addRule('research-agent-block', {
      filter: (node) =>
        node.nodeName === 'DIV' && !!node.classList?.contains('research-agent-block'),
      replacement: (_content, node) => {
        const element = node as Element;
        const conversationId = element.getAttribute('data-conversation-id') ?? '';
        const producedBy = element.getAttribute('data-produced-by-conversation-id');
        const title = element.getAttribute('data-conversation-title');
        const lastActivityAt = element.getAttribute('data-conversation-last-activity-at');
        const attrs: string[] = [`conversationId="${escapeMarkerAttr(conversationId)}"`];
        if (title !== null) attrs.push(`title="${escapeMarkerAttr(title)}"`);
        if (lastActivityAt !== null) attrs.push(`lastActivityAt="${escapeMarkerAttr(lastActivityAt)}"`);
        if (producedBy) attrs.push(`producedByConversationId="${escapeMarkerAttr(producedBy)}"`);
        return `\n\n%%% agent-block ${attrs.join(' ')} %%%\n\n`;
      },
    })
    turndownService.addRule('research-mention', {
      filter: (node) =>
        node.nodeName === 'SPAN' && !!node.classList?.contains(MENTION_DOM_CLASS),
      replacement: (_content, node) => {
        const element = node as Element;
        const kind = element.getAttribute('data-mention-kind');
        const id = element.getAttribute('data-mention-id');
        const title = element.getAttribute('data-mention-title') ?? '';
        if (!isMentionKind(kind) || !id) return '';
        return formatMentionToken({ kind, id, title });
      },
    })
    turndownService.use(gfm); // Add support for strikethrough and tables
    turndownService.addRule('suggestion-deletion', {
      filter: ['del'],
      replacement: (content) => `<del>${content}</del>`
    })
    turndownService.addRule('suggestion-insertion', {
      filter: ['ins'],
      replacement: (content) => `<ins>${content}</ins>`
    })
    turndownService.remove('style') // Make sure we don't add the content of style tags to the markdown
    turndownService.addRule('raw-markdown', {
      filter: (node, options) => hasDataMarkdownAttribute(node),
      replacement: (content, node) => {
        const element = node as Element;
        const markdown = element.getAttribute('data-markdown') ?? '';
        const indentLevel = Number.parseInt(element.getAttribute('data-indent-level') ?? "0", 10) || 0;
        const indentedMarkdown = indentMarkdown(unescape(markdown), indentLevel);
        return `\n\n${indentedMarkdown}\n\n`
      }
    })
    turndownService.addRule('markdown-title', {
      filter: (node, options) => node.classList?.contains('markdown-title'),
      replacement: (content) => `# ${content.trim()}\n\n`,
    })
    turndownService.addRule('footnote-ref', {
      filter: (node, options) => node.classList?.contains('footnote-reference'),
      replacement: (content, node) => {
        // Use the data-footnote-id attribute to get the footnote id
        const id = (node as unknown as Element).getAttribute('data-footnote-id') || 'MISSING-ID'
        return `[^${id}]`
      }
    })
    
    turndownService.addRule('footnote', {
      filter: (node, options) => node.classList?.contains('footnote-item'),
      replacement: (content, node) => {
        // Use the data-footnote-id attribute to get the footnote id
        const id = (node as unknown as Element).getAttribute('data-footnote-id') || 'MISSING-ID'

        // Get the content of the footnote from the footnote-content div.
        // `textContent` of the div as a whole jams adjacent block children
        // together ("…bonus post?A fellow Resident…"); join the blocks'
        // texts with spaces instead.
        const contentElement = (node as unknown as Element).querySelector('.footnote-content')
        const blockChildren = contentElement ? Array.from(contentElement.children) : []
        const text = blockChildren.length > 0
          ? blockChildren.map((child) => (child.textContent ?? '').trim()).filter(Boolean).join(' ')
          : (contentElement?.textContent || '')
        return `[^${id}]: ${text} \n\n`
      }
    })
    // CommonMark link text cannot contain blank lines, but an anchor wrapping
    // block content (a clickable figure/image) otherwise emits
    // `[\n\n![alt](img)\n\n](target)`, which renders as literal brackets.
    // Collapse the link text onto one line; mirrors Turndown's default
    // inlineLink rule otherwise.
    turndownService.addRule('inline-link-single-line', {
      filter: (node, options) =>
        options.linkStyle === 'inlined'
        && node.nodeName === 'A'
        && !!(node as Element).getAttribute('href'),
      replacement: (content, node) => {
        const element = node as Element;
        const href = (element.getAttribute('href') ?? '').replace(/([()])/g, '\\$1');
        const rawTitle = element.getAttribute('title');
        const title = rawTitle ? ` "${rawTitle.replace(/(\n+\s*)+/g, ' ').replace(/"/g, '\\"')}"` : '';
        const singleLineContent = content.replace(/\s*\n\s*/g, ' ').trim();
        if (!singleLineContent) return '';
        return `[${singleLineContent}](${href}${title})`;
      }
    })
    turndownService.addRule('subscript', {
      filter: ['sub'],
      replacement: (content) => `~${content}~`
    })
    turndownService.addRule('supscript', {
      filter: ['sup'],
      replacement: (content) => `^${content}^`
    })
    turndownService.addRule('italic', {
      filter: ['i', 'em'],
      replacement: flankingAwareEmphasis('*'),
    })
    turndownService.addRule('bold', {
      filter: ['b', 'strong'],
      replacement: flankingAwareEmphasis('**'),
    })
    // The `\(…\)` / `\[…\]` annotation delimiters, with one backslash in the
    // raw DOM text; a second is tolerated for content that carries an extra
    // level of escaping.
    const convertMathDelimiters = (text: string, followingChar?: string): string | null => {
      const trimmed = text.trim();
      const inlineMatch = trimmed.match(/^\\{1,2}\(([\s\S]*?)\\{1,2}\)$/);
      if (inlineMatch) {
        // `followingChar` lets `formatMathToken` fall back to the `\(…\)` form
        // when the bare `$…$` form would not round-trip (e.g. before a digit).
        return formatMathToken({ equation: inlineMatch[1], inline: true }, followingChar);
      }
      const blockMatch = trimmed.match(/^\\{1,2}\[([\s\S]*?)\\{1,2}\]$/);
      if (blockMatch) {
        // Display equations are block-level here: pad with blank lines so the
        // `$$…$$` sits on its own lines in the surrounding markdown.
        return `\n\n${formatMathToken({ equation: blockMatch[1], inline: false })}\n\n`;
      }
      return null;
    };

    //If we have a math-tex block, we want to convert it to markdown math delimiters
    turndownService.addRule('latex-spans', {
      filter: (node, options) => node.classList?.contains('math-tex'),
      replacement: (_content, node) => {
        const followingChar = firstCharFollowingNode(node);
        // Take the equation from the DOM text directly rather than from
        // `content`: content has been through Turndown's markdown escaping,
        // and un-escaping it cannot distinguish an escaped `\` from a
        // genuine LaTeX `\\` row separator (which it halved, corrupting
        // array/matrix equations).
        const rawText = node.textContent ?? '';
        const converted = convertMathDelimiters(rawText, followingChar);
        return converted ?? rawText;
      }
    })
    
    // Collapsible-section markers are line-anchored syntax: without the
    // blank-line padding they can fuse onto the preceding block's text
    // ("…it). +++ Can I…"), where consumers' line-start parsing misses them.
    turndownService.addRule('collapsible-section-start', {
      filter: (node, options) => node.classList?.contains('detailsBlockTitle'),
      replacement: (content) => `\n\n+++ ${content.trim()}\n\n`
    });
    turndownService.addRule('collapsible-section-end', {
      filter: (node, options) => node.classList?.contains('detailsBlock'),
      replacement: (content) => `\n\n${content.trim()}\n\n+++\n\n`
    });

    // Spoiler blocks: `<div class="spoilers">…</div>` → `>!`-prefixed lines.
    // Lexical's SpoilerNode and the legacy DraftJS pipeline both produce this
    // canonical wrapper. Each line of the inner markdown gets `>! ` prefixed
    // (or just `>!` for paragraph-separator blank lines).
    const prefixSpoilerLines = (content: string): string => {
      const trimmed = content.replace(/^\n+|\n+$/g, '');
      if (!trimmed) return '';
      return trimmed.split('\n').map((line) => line ? `>! ${line}` : '>!').join('\n');
    };
    turndownService.addRule('spoiler-block', {
      filter: (node) =>
        node.nodeName === 'DIV' && !!node.classList?.contains('spoilers'),
      replacement: (content) => {
        const prefixed = prefixSpoilerLines(content);
        return prefixed ? `\n\n${prefixed}\n\n` : '';
      },
    });
    // Backwards-compat: a bare `<p class="spoiler-v2">` (legacy DraftJS form
    // before `wrapSpoilerTags` runs) should still serialize as a spoiler
    // line, so it round-trips through the agent API.
    turndownService.addRule('spoiler-paragraph-v2', {
      filter: (node) =>
        node.nodeName === 'P' && !!node.classList?.contains('spoiler-v2'),
      replacement: (content) => {
        const prefixed = prefixSpoilerLines(content);
        return prefixed ? `\n\n${prefixed}\n\n` : '';
      },
    });
    (turndownService as AnyBecauseHard).__buildMarker = TURNDOWN_BUILD_MARKER;
    _turndownService = turndownService;
  }
  return _turndownService;
}

function hasDataMarkdownAttribute(node: Node): boolean {
  return node?.nodeType === ServerSafeNode.ELEMENT_NODE
    && typeof (node as Element).getAttribute === 'function'
    && (node as Element).getAttribute('data-markdown') !== null
}

let _mathjax3: {
  adaptor: LiteAdaptor;
  tex: TeX<unknown, unknown, unknown>;
  chtml: CHTML<LiteElement, unknown, unknown>;
} | null = null;

function getMathjax3() {
  if (_mathjax3) return _mathjax3;

  const adaptor = liteAdaptor();
  // eslint-disable-next-line babel/new-cap
  const handler = RegisterHTMLHandler(adaptor);
  // Embed assistive MathML, which helps screen readers and provides elements
  // that don't require custom JS for RSS readers
  AssistiveMmlHandler(handler);

  const tex = new TeX({
    packages: AllPackages,
  });

  const chtml = new CHTML<LiteElement, unknown, unknown>({
    fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2',
    scale: 0.92
  });

  _mathjax3 = { adaptor, tex, chtml };
  return _mathjax3;
}

/**
 * Render LaTeX math expressions in an HTML fragment using MathJax 3.
 *
 * Replaces inline (\(...\)) and display ($$...$$ / \[...\]) TeX delimiters
 * with pre-rendered CHTML elements. The required MathJax CSS is inlined
 * before the first rendered element so that it travels with the content
 * into RSS feeds, scrapers, etc.
 */
export function renderMathInHtml(html: string): string {
  if (isAnyTest) return html;

  try {
    const { adaptor, tex, chtml } = getMathjax3();

    const doc = mathjax.document(html, {
      InputJax: tex,
      OutputJax: chtml,
    });

    doc.render();

    const renderedHtml: string = adaptor.innerHTML(adaptor.body(doc.document));
    const css: string = adaptor.textContent(chtml.styleSheet(doc));

    if (!css || !renderedHtml.includes('mjx-container')) {
      return renderedHtml;
    }

    // Inline the CSS with the first MathJax element so it's included in
    // RSS feeds, external scrapers, etc. (same rationale as the old
    // trimLatexAndAddCSS callback used with mathjax-node-page).
    const $ = cheerioParse(renderedHtml);
    // Drop only truly empty display equations.
    // In MathJax v3, valid display equations can have empty text() while still
    // containing rendered child nodes (<mjx-math>...), so text().trim()===""
    // alone is not a safe emptiness check.
    $('mjx-container[display="true"]').each((_, elem) => {
      const node = $(elem);
      const hasRenderedChildren = node.children().length > 0;
      const hasMeaningfulText = node.text().trim() !== '';
      if (!hasRenderedChildren && !hasMeaningfulText) {
        node.remove();
      }
    });

    const firstMathContainer = $('mjx-container').first();
    if (firstMathContainer.length > 0) {
      const styleNode = $('<style></style>').text(css);
      firstMathContainer.before(styleNode);
      return $.html();
    }

    return renderedHtml;
  } catch (err) {
    captureException(err);
    // eslint-disable-next-line no-console
    console.error('Error rendering math with MathJax:', err);
    return html;
  }
}

// Adapted from: https://github.com/cheeriojs/cheerio/issues/748
export const cheerioWrapAll = (toWrap: Cheerio<AnyBecauseHard>, wrapper: string, $: CheerioAPI) => {
  if (toWrap.length < 1) {
    return toWrap;
  }

  if (toWrap.length < 2 && ($ as any).wrap) { // wrap not defined in npm version,
    return ($ as any).wrap(wrapper);      // and git version fails testing.
  }

  const section = $(wrapper);
  let  marker = $('<div>');
  marker = marker.insertBefore(toWrap.first()); // in jQuery marker would remain current
  toWrap.each(function(k, v) {                  // in Cheerio, we update with the output.
    $(v).remove();
    section.append($(v));
  });
  section.insertBefore(marker);
  marker.remove();
  return section;                 // This is what jQuery would return, IIRC.
}

const spoilerClass = 'spoiler-v2' // this is the second iteration of a spoiler-tag that we've implemented. Changing the name for backwards-and-forwards compatibility

/// Given HTML which possibly contains elements tagged with with a spoiler class
/// (ie, hidden until mouseover), parse the HTML, and wrap consecutive elements
/// that all have a spoiler tag in a shared spoiler element (so that the
/// mouse-hover will reveal all of them together).
function wrapSpoilerTags(html: string): string {
  const $ = cheerioParse(html)

  // Iterate through spoiler elements, collecting them into groups. We do this
  // the hard way, because cheerio's sibling-selectors don't seem to work right.
  let spoilerBlockGroups: Array<CheerioElement[]> = [];
  let currentBlockGroup: CheerioElement[] = [];
  $(`.${spoilerClass}`).each(function(this: any) {
    const element = this;
    if (!(element?.previousSibling && $(element.previousSibling).hasClass(spoilerClass))) {
      if (currentBlockGroup.length > 0) {
        spoilerBlockGroups.push(currentBlockGroup);
        currentBlockGroup = [];
      }
    }
    currentBlockGroup.push(element);
  });
  if (currentBlockGroup.length > 0) {
    spoilerBlockGroups.push(currentBlockGroup);
  }

  // Having collected the elements into groups, wrap each group.
  for (let spoilerBlockGroup of spoilerBlockGroups) {
    cheerioWrapAll($(spoilerBlockGroup), '<div class="spoilers" />', $);
  }

  // Serialize back to HTML.
  return $.html()
}

export const handleDialogueHtml = async (html: string, context: ResolverContext): Promise<string> => {
  const { Users } = context;
  const $ = cheerioParse(html);

  $('.dialogue-message-input-wrapper').remove();
  $('.dialogue-message-input').remove();

  const userIds: string[] = [];
  $('.dialogue-message').each((idx, element) => {
    const userId = $(element).attr('user-id');
    if (userId) userIds.push(userId);
  });

  const rawUsers = await Users.find({ _id: { $in: userIds } }, {}, { _id: 1, displayName: 1 }).fetch();

  if (rawUsers.some((user) => !user.displayName)) throw new Error('Some users in dialogue have no display name'); //should never happen, better than filtering out users with no display name
  const users = filterWhereFieldsNotNull(rawUsers, "displayName"); //shouldn't get to this point if missing displayname, but need to make types happy

  const userDisplayNamesById = Object.fromEntries(users.map((user) => [user._id, user.displayName]));

  $('.dialogue-message').each((idx, element) => {
    const userId = $(element).attr('user-id');
    if (userId && userDisplayNamesById[userId]) {
      $(element)
        .prepend(`<section class="dialogue-message-header CommentUserName-author UsersNameDisplay-noColor"><b></b></section>`)
        .find('.dialogue-message-header b')
        .text(userDisplayNamesById[userId])
    }
  });

  return $.html();
};


const trimLeadingAndTrailingWhiteSpace = (html: string): string => {
  const $ = cheerioParse(`<div id="root">${html}</div>`)
  const topLevelElements = $('#root').children().get()
  // Iterate once forward until we find non-empty paragraph to trim leading empty paragraphs
  removeLeadingEmptyParagraphsAndBreaks(topLevelElements, $)
  // Then iterate backwards to trim trailing empty paragraphs
  removeLeadingEmptyParagraphsAndBreaks(topLevelElements.reverse(), $)
  return $("#root").html() || ""
}

const removeLeadingEmptyParagraphsAndBreaks = (elements: CheerioElement[], $: CheerioAPI) => {
   for (const elem of elements) {
    if (isEmptyParagraphOrBreak(elem)) {
      $(elem).remove()
    } else {
      break
    }
  }
}

const isEmptyParagraphOrBreak = (elem: CheerioElement) => {
  if (elem.type === 'tag' && elem.name === "p") {
    if (elem.children?.length === 0) return true
    if (elem.children?.length === 1 && elem.children[0]?.type === "text" && (elem.children[0] as DataNode)?.data?.trim() === "") return true
    return false
  }
  if (elem.type === 'tag' && elem.name === "br") return true
  return false
}

export async function draftJSToHtmlWithLatex(draftJS: AnyBecauseTodo) {
  const html = draftToHTML(convertFromRaw(draftJS))
  const trimmedHtml = trimLeadingAndTrailingWhiteSpace(html)
  return wrapSpoilerTags(trimmedHtml)
}

// Fold non-breaking spaces in TEXT content to plain spaces. Turndown's
// whitespace machinery (collapse + flankingWhitespace) only recognizes ASCII
// whitespace; Lexical exports boundary spaces as &nbsp;, which Turndown
// mishandles — in some configurations dropping the space entirely (e.g.
// `<i>a</i><span>&nbsp;b c </span><i>d</i>` → `*a*b c *d*`). Markdown has no
// meaningful non-breaking space in prose, so fold them before conversion and
// let Turndown's native handling place them. The fold operates on parsed text
// nodes, not the raw string: attribute values (most importantly widget
// iframes' srcdoc, which round-trips verbatim through the agent read/write
// path) must keep their NBSPs.
function foldNbspInTextNodes(html: string): string {
  if (!/&nbsp;|&#0*160;|&#[xX]0*[aA]0;|\u00A0/.test(html)) {
    return html;
  }
  const $ = cheerioParse(html);
  $.root().find('*').addBack().contents().each((_index, node) => {
    // domhandler's isText guard can't be used here: cheerio bundles its own
    // domhandler copy, so the guard's Node type doesn't unify with the nodes
    // cheerio yields. The type/cast pair matches the emptyParagraph check above.
    if (node.type === 'text') {
      const dataNode = node as DataNode;
      dataNode.data = dataNode.data.replace(/\u00A0/g, ' ');
    }
  });
  return $.html();
}

export function htmlToMarkdown(html: string): string {
  return getTurndown().turndown(foldNbspInTextNodes(html))
}

export function ckEditorMarkupToMarkdown(markup: string): string {
  // Sanitized CKEditor markup is just html
  return getTurndown().turndown(sanitize(markup))
}

export function markdownToHtmlNoLaTeX(markdown: string): string {
  const id = randomId()
  const renderedMarkdown = getMarkdownIt().render(markdown, {docId: id})
  return trimLeadingAndTrailingWhiteSpace(renderedMarkdown)
}

// Unlike `markdownToHtmlNoLaTeX`, this skips the `markdownItMathjax` markdown-it
// plugin entirely, so `$...$` and `\(...\)` are treated as literal text rather
// than parsed into math tokens. Used by the agent quote-matching path, where
// we want the LaTeX delimiters preserved verbatim in the extracted plaintext
// so they line up with MathNode segments on the document side.
export function markdownToHtmlNoMath(markdown: string): string {
  const id = randomId()
  const renderedMarkdown = getMarkdownItNoMathjax().render(markdown, {docId: id})
  return trimLeadingAndTrailingWhiteSpace(renderedMarkdown)
}

export function markdownToHtml(markdown: string, options?: {
  skipMathjax?: boolean
}): string {
  const html = markdownToHtmlNoLaTeX(markdown)
  if (options?.skipMathjax) {
    return html;
  } else {
    return renderMathInHtml(html)
  }
}

async function ckEditorMarkupToHtml(markup: string, context: ResolverContext, skipMathjax?: boolean): Promise<string> {
  // Sanitized CKEditor markup is just html
  const html = sanitize(markup)
  const trimmedHtml = trimLeadingAndTrailingWhiteSpace(html)
  const hydratedHtml = await handleDialogueHtml(trimmedHtml, context)
  // Render any LaTeX tags we might have in the HTML
  if (skipMathjax) {
    return hydratedHtml;
  } else {
    return renderMathInHtml(hydratedHtml)
  }
}

/**
 * This is mostly a fallback, since we should already be stripping
 * private lexical markup on the client using `getDataWithDiscardedSuggestions`.
 * This doesn't have correct rejection semantics, since it only handles
 * plain insertions/deletions properly and not property changes,
 * which are rendered as `ins` wrappers that would cause the changed
 * element to be deleted here.  This is fine as a last-ditch
 * saving throw but ideally this should be a no-op.
 */
function removePrivateLexicalMarkup(markup: string): string {
  const $ = cheerioParse(markup);

  const insCount = $('ins').length;
  const delCount = $('del').length;
  if (insCount > 0 || delCount > 0) {
    const error = new Error(
      `removePrivateLexicalMarkup: unexpected suggestion markup (${insCount} ins, ${delCount} del). ` +
      `This means dataWithDiscardedSuggestions was not provided by the client, or the client's implementation is incorrect; falling back to lossy server-side stripping.`
    );
    // eslint-disable-next-line no-console
    console.error(error.message);
    captureException(error);
  }

  // Suggested edits leave `ins` and `del` wrappers in the markup, and comments leave `mark` wrapper.
  // We want to remove all the wrappers, and in the case of insertions, delete the content, to prevent
  // leaking any suggested edits that haven't been explicitly accepted to readers.
  $('ins').remove();
  $('del').unwrap();
  $('mark').unwrap();
  return $.html();
}

function lexicalMarkupToHtml(markup: string, context: ResolverContext, skipMathjax?: boolean): string {
  const html = sanitize(markup);
  const trimmedHtml = trimLeadingAndTrailingWhiteSpace(html);
  const strippedHtml = removePrivateLexicalMarkup(trimmedHtml);
  if (skipMathjax) {
    return strippedHtml;
  } else {
    return renderMathInHtml(strippedHtml);
  }
}

export async function extractAndReplaceIframeWidgets(html: string, revisionId: string): Promise<string> {
  const $ = cheerioParse(html);
  const srcdocsToInsert: DbInsertion<DbIframeWidgetSrcdoc>[] = [];

  $('iframe[data-lexical-iframe-widget]').each((_, element) => {
    const iframe = $(element);
    const rawSrcdoc = iframe.attr('srcdoc') ?? '';
    if (!rawSrcdoc) {
      return;
    }
    const srcdoc = cheerioParse(rawSrcdoc).root().find('del').remove().end().html() ?? '';

    const srcdocId = randomId();
    srcdocsToInsert.push({
      _id: srcdocId,
      createdAt: new Date(),
      schemaVersion: 1,
      revisionId,
      html: srcdoc,
    });

    const replacementDiv = $('<div></div>')
      .addClass('iframe-widget')
      .attr('data-iframe-widget-id', srcdocId);
    iframe.replaceWith(replacementDiv);
  });

  if (srcdocsToInsert.length === 0) {
    return html;
  }
  await IframeWidgetSrcdocs.rawInsertMany(srcdocsToInsert);
  return $.html();
}

interface DataToHTMLOptions {
  sanitize?: boolean,
  skipMathjax?: boolean,
}

export async function dataToHTML(data: AnyBecauseTodo, type: string, context: ResolverContext, options?: DataToHTMLOptions) {
  switch (type) {
    case "html":
      const maybeSanitized = options?.sanitize ? sanitize(data) : data;
      if (options?.skipMathjax) {
        return maybeSanitized;
      } else {
        return renderMathInHtml(maybeSanitized)
      }
    case "lexical":
      return lexicalMarkupToHtml(data, context, !!options?.skipMathjax)
    case "ckEditorMarkup":
      return await ckEditorMarkupToHtml(data, context, !!options?.skipMathjax)
    case "draftJS":
      return await draftJSToHtmlWithLatex(data);
    case "markdown":
      return markdownToHtml(data, { skipMathjax: options?.skipMathjax })
    default: throw new Error(`Unrecognized format: ${type}`);
  }
}

export function dataToMarkdown(data: AnyBecauseTodo, type: string) {
  if (!data) return ""
  switch (type) {
    case "markdown": {
      return data
    }
    case "html":
    case "lexical": {
      // Lexical content is stored as HTML
      return htmlToMarkdown(data)
    }
    case "ckEditorMarkup": {
      return ckEditorMarkupToMarkdown(data)
    }
    case "draftJS": {
      try {
        const contentState = convertFromRaw(data);
        const html = draftToHTML(contentState)
        return htmlToMarkdown(html)
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
      return ""
    }
    default: throw new Error(`Unrecognized format: ${type}`);
  }
}

export async function dataToCkEditor(data: AnyBecauseTodo, type: string) {
  switch (type) {
    case "html":
    case "lexical":
      // Lexical content is stored as HTML
      return sanitize(data);
    case "ckEditorMarkup":
      return data;
    case "draftJS":
      return await draftJSToHtmlWithLatex(data);
    case "markdown":
      return markdownToHtml(data)
    default: throw new Error(`Unrecognized format: ${type}`);
  }
}

/**
 * When we calculate the word count we want to ignore footnotes. There's two syntaxes
 * for footnotes in markdown:
 *
 * ```
 * 1.  ^**[^](#fnreflexzxp4wr9h)**^
 *
 *     The contents of my footnote
 * ```
 *
 * and
 *
 * ```
 * [^1]: The contents of my footnote.
 * ```
 *
 * In both cases, the footnote must start at character 0 on the line. The strategy here
 * is just to find the first place where this occurs and then to ignore to the end of
 * the document.
 *
 * We adopt a similar strategy for ignoring appendices. We find the first header tag that
 * contains the word 'appendix' (case-insensitive), and ignore to the end of the document.
 *
 * This function runs when content is saved, not when it's loaded, so it's not too
 * performance sensitive. On the flip side, updates to this function won't affect
 * existing content (without a migration) until the content is edited and resaved.
 *
 * This involves converting from whatever format the content is in to markdown to do
 * the footnote removal, then to HTML to do the appendix removal, then back to markdown
 * to count the words. Any of these steps can potentially fail (throw an exception).
 * In particular, if the post contains LaTeX which contains syntax errors, that can
 * cause a failure; and there is (currently, 2023-08-21) at least one escaping bug which
 * can cause format conversions to _introduce_ LaTeX syntax errors for later conversion
 * steps to run into. Our strategy for this is to keep a running best estimate, to be
 * returned if any step fails.
 */
export async function dataToWordCount(data: AnyBecauseTodo, type: string, context: ResolverContext) {
  let bestWordCount = 0;

  try {
    // Convert to markdown and count words by splitting spaces
    const dataForCounting = (type === "lexical")
      ? stripIframeWidgetSrcdocs(data)
      : data;
    const markdown = dataToMarkdown(dataForCounting, type) ?? "";
    bestWordCount = markdown.trim().split(/[\s]+/g).length;
    
    // Try to remove footnotes and update the count accordingly
    const withoutFootnotes = markdown
      .split(/^1\. {2}\^\*\*\[\^\]\(#(.|\n)*/m)[0]
      .split(/^\[\^1\]:.*/m)[0];
    
    // Sanity check: if removing footnotes lowered the word count by over 60%, we might
    // have removed too much.
    const wordCountWithoutFootnotes = withoutFootnotes.trim().split(/[\s]+/g).length;
    if (wordCountWithoutFootnotes < bestWordCount*.4) {
      return bestWordCount;
    }
    bestWordCount = wordCountWithoutFootnotes;

    // Convert to HTML and try removing appendixes and collapsible section bodies.
    const htmlWithoutFootnotes = await dataToHTML(withoutFootnotes, "markdown", context, { skipMathjax: true }) ?? "";
    const htmlWithoutFootnotesAndAppendices = htmlWithoutFootnotes
      .split(/<h[1-6]>.*(appendix).*<\/h[1-6]>/i)[0];
    const $ = cheerioParse(htmlWithoutFootnotesAndAppendices);
    $('.detailsBlockContent').remove();
    const markdownWithoutFootnotesAndAppendicesOrCollapsedBodies = dataToMarkdown($.html(), "html");
    bestWordCount = markdownWithoutFootnotesAndAppendicesOrCollapsedBodies.trim().split(/[\s]+/g).length;
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Error in dataToWordCount", err)
  }

  return bestWordCount
}

export async function buildRevision({ originalContents, currentUser, dataWithDiscardedSuggestions, context }: {
  originalContents: DbRevision["originalContents"],
  currentUser: DbUser,
  dataWithDiscardedSuggestions?: string,
  context: ResolverContext,
}) {
  return await buildRevisionWithUser({
    originalContents,
    user: currentUser,
    isAdmin: currentUser.isAdmin,
    dataWithDiscardedSuggestions,
    context,
  });
}
export async function buildRevisionWithUser({ originalContents, user, isAdmin, dataWithDiscardedSuggestions, context }: {
  originalContents: DbRevision["originalContents"],
  user: DbUser,
  isAdmin: boolean,
  dataWithDiscardedSuggestions?: string,
  context: ResolverContext,
}) {
  if (!originalContents) throw new Error ("Can't build revision without originalContents")

  const { data, type } = originalContents;
  const readerVisibleData = dataWithDiscardedSuggestions ?? data
  const html = await dataToHTML(readerVisibleData, type, context, { sanitize: !isAdmin || originalContents.type !== "html" })
  const wordCount = await dataToWordCount(readerVisibleData, type, context)

  return {
    html, wordCount, originalContents,
    editedAt: new Date(),
    userId: user._id,
  };
}
