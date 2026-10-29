// EXPERIMENT (experiment/iframe-layout-ronny-exp3): how each kind of content block behaves next to a widget
// the text wraps around (a "floated" widget), in one table that the post (HydratedIframeWidget) and the
// editor (IframeWidgetPlugin) both turn into CSS, so the two always agree. Every rule is scoped to blocks
// after a floated widget (or holding one), so a post without one looks exactly as before.
//
// The behaviors (experiments/iframe-layout/content-blocks/REPORT.md describes each in full):
// - flows beside: text (paragraphs, AI content, inline things). No rule needed.
// - box beside, else below: the block becomes its own box (display: flow-root). It sits beside the widget,
//   narrower, with its border, bar, marker or background out of the widget's way; if less than 300px is
//   left there (the text rule), the browser starts it below the widget instead.
// - beside if it fits at its own size, else below: code, tables and images keep their natural size.
// - clears below: blocks that need the whole column or end a section start below the widget.
// - a widget inside a container stays inside it (or shows full width there).

/** A floated widget in the post: the `.iframe-widget` div holding the floated iframe. */
export const POST_FLOAT = '.iframe-widget:has(> .lwFloatedWidget)';
/** A floated widget in the editor: its preview spacer (the visible frame is an overlay on top of it). */
export const EDITOR_FLOAT = '.iframe-widget-code[data-lw-wraps]';
/** The same, floated left only. */
const POST_LEFT_FLOAT = '.iframe-widget:has(> .lwFloatedWidget[data-lw-side="left"])';
const EDITOR_LEFT_FLOAT = '.iframe-widget-code[data-lw-wraps][data-lw-side="left"]';

type Declarations = Record<string, string | number | Record<string, string | number>>;

interface NeighbourRule {
  /** Selectors for blocks after a floated widget (`POST_FLOAT ~ <selector>`), in the post. */
  postAfter?: string[];
  /** The same in the editor (`EDITOR_FLOAT ~ <selector>`). */
  editorAfter?: string[];
  /** Whole selectors, for rules that aren't about a block after a widget. */
  post?: string[];
  editor?: string[];
  style: Declarations;
}

const BOX_BESIDE: Declarations = {
  display: 'flow-root',
  // 300px, as for text, less a few px so a box always fits where text wraps (widths round differently).
  minWidth: 'min(296px, 100%)',
};

/**
 * Its natural width (the longest line, the narrowest table layout), at least the box floor, at most the
 * column. (A table is already its own box: only the others get display: flow-root.)
 */
const fitOrBelow = (size: 'max-content' | 'min-content', display: 'flow-root' | null = 'flow-root'): Declarations => ({
  ...(display ? { display } : {}),
  // Browsers without calc-size() (Safari, Firefox in 2026) keep the 296px floor: a long code line or a
  // wide table then scrolls beside the widget instead of going below it.
  fallbacks: { minWidth: 'min(296px, 100%)' },
  minWidth: `calc-size(${size}, min(max(size, 296px), 100%))`,
});

const CLEARS_BELOW: Declarations = { clear: 'both' };

/** Embeds: fixed-size frames made for the whole column. */
const POST_EMBEDS = [
  'div.youtube-preview', 'div.metaculus-preview', 'div.manifold-preview', 'div.neuronpedia-preview',
  'div.calendly-preview', 'div.strawpoll-embed', 'div.metaforecast-preview', 'div.owid-preview',
  'div.estimaker-preview', 'div.viewpoints-preview', 'div.lwartifacts-preview', 'div.thoughtSaverFrameWrapper',
  'div.elicit-binary-prediction',
];
/** In the editor an embed is a decorator block (its DOM is a div Lexical marks data-lexical-decorator). */
export const EDITOR_EMBEDS = [
  '[data-lexical-decorator]:has(> div > :is(iframe, .metaculus-preview, .manifold-preview, .neuronpedia-preview, .calendly-preview, .strawpoll-embed, .metaforecast-preview, .owid-preview, .estimaker-preview, .viewpoints-preview, .lwartifacts-preview, .thoughtSaverFrameWrapper))',
  '.elicit-binary-prediction-wrapper',
];

const HEADINGS = ':is(h1, h2, h3, h4, h5, h6)';
const LISTS = ':is(ul, ol):not(.footnote-section, .footnotes)';

const RULES: NeighbourRule[] = [
  // Headings: box beside, else below. A heading sits beside the widget in one piece (all its lines start
  // at the same edge) instead of clearing it, which left a hole beside the widget whenever a section was
  // shorter than the widget.
  { postAfter: [HEADINGS], editorAfter: [HEADINGS], style: BOX_BESIDE },
  // Spoilers (and the legacy bordered blocks): box beside, else below. The black cover and the borders
  // stay out of the widget (which is see-through: anything under it shows).
  {
    postAfter: ['.spoiler-block', '.conditionallyVisibleBlock', 'figure.table'],
    editorAfter: ['div.spoilers'],
    style: BOX_BESIDE,
  },
  // Quotes and collapsible sections: box beside a LEFT widget, else below, so the bar, or the triangle
  // and rule, stay out of it. Beside a right widget nothing runs under it, so they flow like text there
  // (a box would stay narrow for its whole length). (The `~` means any left widget before them, so after
  // a left widget AND a later right one they are boxes beside the right one too.)
  {
    post: ['blockquote', '.detailsBlock'].map(s => `${POST_LEFT_FLOAT} ~ ${s}`),
    editor: ['blockquote', '.detailsBlock'].map(s => `${EDITOR_LEFT_FLOAT} ~ ${s}`),
    style: BOX_BESIDE,
  },
  // Lists: beside a left widget each item is its own box, so the markers and indents (nested levels too)
  // sit beside the widget instead of under it, and the items below it get the whole width back.
  {
    post: [`${POST_LEFT_FLOAT} ~ ${LISTS} li`], editor: [`${EDITOR_LEFT_FLOAT} ~ ${LISTS} li`],
    style: { fallbacks: { display: 'list-item' }, display: 'flow-root list-item' },
  },
  {
    // A box doesn't let its last child's bottom margin through, so a nested list's last item drops its
    // own (the parent item's margin keeps the spacing as it was).
    post: [`${POST_LEFT_FLOAT} ~ ${LISTS} li > :is(ul, ol) > li:last-child`],
    editor: [`${EDITOR_LEFT_FLOAT} ~ ${LISTS} li > :is(ul, ol) > li:last-child`],
    style: { marginBottom: 0 },
  },
  // Code: beside only if every line fits there, else below at full width (a widget never makes code
  // scroll). Editor: CodeNode's code.code-block (a widget's own spacer is a .code-block too).
  { postAfter: ['pre'], editorAfter: ['.code-block:not(.iframe-widget-preview-mode)'], style: fitOrBelow('max-content') },
  // Tables: beside if the table's narrowest layout fits (and 300px), else below at full width.
  {
    postAfter: ['table'],
    editorAfter: ['.table-scrollable-wrapper'],
    style: fitOrBelow('min-content', null),
  },
  // A bare post table is width:100% of the column, which never fits beside a widget: fill the room.
  { postAfter: ['table'], style: { width: 'stretch', fallbacks: { width: '-webkit-fill-available' } } },
  // The post's scroll box: a block (table, equation, wide paragraph) that was wider than the whole column
  // when the page loaded. It can't fit beside a widget, so it starts below it (beside it, it was squeezed
  // and drew its scroll arrow over the widget).
  { postAfter: ['.horiz-scroll-block'], style: CLEARS_BELOW },
  // The editor shows every display equation in a scroll box: beside a widget if the whole equation fits,
  // else below (in the post the equation's own line does the same).
  { editorAfter: ['div.math-tex > .horiz-scroll-block'], style: fitOrBelow('min-content') },
  // Images keep the size the author gave them: beside the widget if that fits, centered in the room
  // there, else below. A plain post image is a bare img; a resized one is a figure with width N%.
  { postAfter: ['img'], style: { display: 'block', marginLeft: 'auto', marginRight: 'auto' } },
  {
    postAfter: ['figure.image_resized', 'figure.excalidraw-diagram_resized'],
    editorAfter: ['figure[style*="width"]'],
    style: { display: 'flow-root' },
  },
  // The editor's image box was 100% wide (so every image went below the widget): it wraps the image, as
  // the post's img does, and the image toolbar stays over the image.
  {
    editorAfter: ['figure .lw-image-container'],
    // (On the baseline, like the post's img: see Editor.tsx's figure rules.)
    style: { display: 'inline-flex', width: 'auto', maxWidth: '100%', verticalAlign: 'baseline' },
  },
  { editorAfter: ['div:has(> figure > button)'], style: { textAlign: 'center' } },
  { editorAfter: ['div > figure:has(> button)'], style: { display: 'inline-block', verticalAlign: 'top', margin: '1em 0' } },
  // Dividers, embeds and the footnotes: clear below. A divider or the footnotes end a section; an embed
  // is a fixed-size frame made for the whole column (beside a widget it was squeezed or ran under it).
  { postAfter: ['hr', ...POST_EMBEDS, '.footnotes'], editorAfter: ['hr', ...EDITOR_EMBEDS, '.footnote-section'], style: CLEARS_BELOW },
  { post: POST_EMBEDS.map(e => `${POST_FLOAT} ~ * ${e}`), editor: EDITOR_EMBEDS.map(e => `${EDITOR_FLOAT} ~ * ${e}`), style: CLEARS_BELOW },
  // The editor's page break marker (posts get an empty figure): its grey band narrows beside the widget.
  { editorAfter: ['figure[type="page-break"]'], style: { display: 'flow-root', width: 'auto' } },
  // (The editor's caret paragraphs between blocks are out of the flow, so the margins around them collapse
  // as in the post; beside a widget, widgetSliverGuard narrows their caret line to the text beside it.)
  // A widget inside a quote, a list item, an open collapsible section or an AI content block floats
  // inside it (sized and wrapped against its width), and the container holds it: its bar, rule or end
  // runs past the widget instead of the widget hanging out into the blocks after it.
  {
    post: [
      'blockquote:has(> .iframe-widget > .lwFloatedWidget)',
      '.detailsBlock:not(.closed) > .detailsBlockContent:has(> .iframe-widget > .lwFloatedWidget)',
      '.llm-content-block:has(> .llm-content-block-content > .iframe-widget > .lwFloatedWidget)',
    ],
    editor: [
      `blockquote:has(> ${EDITOR_FLOAT})`,
      `.detailsBlock:not(.detailsBlockClosed) > .detailsBlockContent:has(> ${EDITOR_FLOAT})`,
      `.llm-content-block:has(> .llm-content-block-content > ${EDITOR_FLOAT})`,
    ],
    style: { display: 'flow-root' },
  },
  {
    post: ['li:has(> .iframe-widget > .lwFloatedWidget)'], editor: [`li:has(> ${EDITOR_FLOAT})`],
    style: { fallbacks: { display: 'list-item' }, display: 'flow-root list-item' },
  },
  // A widget placed mid-text in a list item starts on the line it was placed on, as in the editor (where
  // the widget itself floats among the text): the post's div around it broke the line, so the widget
  // started a line lower there and the item was a line taller.
  { post: ['li > .iframe-widget:has(> .lwFloatedWidget)'], style: { display: 'inline' } },
  // AI content: flows beside like paragraphs. Its model label rides with the text: a block that doesn't
  // start with a paragraph shows the label on a line of its own (as a block it sat under a left widget,
  // with its rule running down the widget's height).
  {
    editorAfter: ['.llm-content-block:not(:has(> .llm-content-block-content > p:first-child)) > .llm-content-block-header'],
    style: { display: 'inline-flex', width: 'auto', margin: '0 0 1em', verticalAlign: 'top' },
  },
  {
    postAfter: ['.llm-content-block:not(:has(> .llm-content-block-content > p:first-child))::before'],
    style: { display: 'inline-block', width: 'auto', margin: '0 0 1em', verticalAlign: 'top' },
  },
  // ...and after a left widget pushed down to line up with the block's end (align=bottom), the label
  // stops floating, so it doesn't sit out at the widget's far edge with an empty gap before it.
  {
    editor: [
      `:is(${EDITOR_FLOAT}[data-lw-side="left"][data-lw-pushed] + .llm-content-block, ${EDITOR_FLOAT}[data-lw-side="left"][data-lw-pushed] + .sentinel-paragraph + .llm-content-block) > .llm-content-block-header`,
    ],
    style: { float: 'none', display: 'inline-flex', width: 'auto', margin: '0 0 0.5em', verticalAlign: 'top' },
  },
  {
    post: ['.iframe-widget:has(> .lwFloatedWidget[data-lw-side="left"][data-lw-pushed]) + .llm-content-block::before'],
    style: { float: 'none', display: 'inline-block', width: 'auto', margin: '0 0 0.5em', verticalAlign: 'top' },
  },
  // The post body ends below its last widget, so a widget at the very end doesn't hang into what follows
  // the post's text (an event's date line, the subscribe buttons). The editor pages hold theirs already.
  { post: [':has(> .iframe-widget > .lwFloatedWidget)::after'], style: { content: '""', display: 'block', clear: 'both' } },
  // A block the sliver guard (widgetSliverGuard.ts) moved below a widget it barely touched.
  { post: ['[data-lw-below]'], editor: ['[data-lw-below]'], style: CLEARS_BELOW },
];

/** The rules as JSS '@global' entries for the post (`'post'`) or the editor. */
export function widgetNeighbourGlobals(view: 'post' | 'editor'): Record<string, Declarations> {
  const globals: Record<string, Declarations> = {};
  for (const rule of RULES) {
    const selectors = view === 'post'
      ? [...(rule.postAfter ?? []).map(s => `${POST_FLOAT} ~ ${s}`), ...(rule.post ?? [])]
      : [...(rule.editorAfter ?? []).map(s => `${EDITOR_FLOAT} ~ ${s}`), ...(rule.editor ?? [])];
    if (!selectors.length) continue;
    const key = selectors.join(', ');
    // (Two rules can make the same selector: their fallbacks are merged, not replaced.)
    const before = globals[key] ?? {};
    const merged: Declarations = { ...before, ...rule.style };
    if (before.fallbacks && rule.style.fallbacks) {
      merged.fallbacks = { ...before.fallbacks as Record<string, string>, ...rule.style.fallbacks as Record<string, string> };
    }
    globals[key] = merged;
  }
  return globals;
}

/**
 * Editor blocks that start below a floated widget before them (clears below), for the drag: a widget the
 * text wraps around dropped just before one would sit beside nothing, so it goes below it instead.
 */
export const EDITOR_CLEARING_BLOCKS = ['hr', ...EDITOR_EMBEDS].join(', ');
