// EXPERIMENT (branch experiment/iframe-layout-ronny): author-chosen placement for an iframe widget,
// read from a tag in the widget's own HTML, for example
//   <meta name="lw-layout" content="position=right width=40%">
// position: inline (default, full text width), center, left or right (left/right float, so the
// text wraps around the widget). width: a percentage of the text column, or pixels.
// A real version would store these on the editor node and set them with toolbar buttons.

export type IframeWidgetPosition = 'inline' | 'center' | 'left' | 'right';

export interface IframeWidgetLayout {
  position: IframeWidgetPosition,
  width: string | null,
}

const POSITIONS: IframeWidgetPosition[] = ['inline', 'center', 'left', 'right'];
const LAYOUT_META_RE = /<meta[^>]+name=["']lw-layout["'][^>]*>/i;
const CONTENT_ATTRIBUTE_RE = /content=["']([^"']*)["']/i;
const WIDTH_RE = /^\d+(\.\d+)?(%|px)$/;

function parseSettings(content: string): Map<string, string> {
  const settings = new Map<string, string>();
  for (const pair of content.split(/[\s;,]+/)) {
    const [key, value] = pair.split('=');
    if (key && value) settings.set(key.trim().toLowerCase(), value.trim().toLowerCase());
  }
  return settings;
}

export function parseIframeWidgetLayout(srcdoc: string): IframeWidgetLayout {
  const tag = srcdoc.match(LAYOUT_META_RE)?.[0];
  const settings = parseSettings(tag?.match(CONTENT_ATTRIBUTE_RE)?.[1] ?? '');
  const position = POSITIONS.find(p => p === settings.get('position')) ?? 'inline';
  const width = settings.get('width');
  return { position, width: width && WIDTH_RE.test(width) ? width : null };
}

// A left/right widget only wraps if the text beside it stays at least this wide (about 40 characters
// of post text, like a newspaper column; low enough that a half-width widget wraps in the normal
// 682px column). Otherwise it sits inline at full width. Shared by the reader and the editor.
export const MIN_TEXT_BESIDE_WIDGET = 300;
export const WRAP_GUTTER = 32;
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): nor does one narrower than this (px), which leaves
// a widget too cramped to use; it too shows full width.
export const MIN_WIDGET_WIDTH = 150;

/** The widget's width in px for a text column of the given width (null: full width). */
export function widgetWidthPx(layout: IframeWidgetLayout, columnWidth: number): number | null {
  if (!layout.width) return null;
  const value = parseFloat(layout.width);
  return layout.width.endsWith('%') ? Math.round(columnWidth * value / 100) : value;
}

export function shouldWrapWidget(layout: IframeWidgetLayout, columnWidth: number | null): boolean {
  if (layout.position !== 'left' && layout.position !== 'right') return false;
  if (!columnWidth) return false;
  const width = widgetWidthPx(layout, columnWidth) ?? columnWidth;
  return width >= MIN_WIDGET_WIDTH && columnWidth - width - WRAP_GUTTER >= MIN_TEXT_BESIDE_WIDGET;
}

// EXPERIMENT (experiment/iframe-layout-ronny-exp2): the widths the editor offers for a left/right
// widget, and helpers for dragging and resizing widgets in the editor.
/** Widths that leave room to wrap in LessWrong's normal 682px text column. */
export const ALLOWED_WIDGET_WIDTHS: readonly string[] = ['25%', '33%', '38%', '50%'];
/** What a resize snaps to, as fractions of the text column (1 = full width). */
export const SNAP_FRACTIONS: readonly number[] = [0.25, 0.33, 0.38, 0.5, 1];

/** The narrowest text column (px) in which a left/right widget of this width wraps. */
export function minColumnToWrap(width: string): number {
  const value = parseFloat(width);
  if (!(value > 0)) return Infinity;
  if (!width.endsWith('%')) return value < MIN_WIDGET_WIDTH ? Infinity : value + MIN_TEXT_BESIDE_WIDGET + WRAP_GUTTER;
  const fraction = value / 100;
  if (fraction >= 1) return Infinity;
  // Start just below the answer and count up, so the rounding in widgetWidthPx is honoured exactly.
  const layout: IframeWidgetLayout = { position: 'left', width };
  let column = Math.max(1,
    Math.floor((MIN_TEXT_BESIDE_WIDGET + WRAP_GUTTER - 1) / (1 - fraction)) - 1,
    Math.floor((MIN_WIDGET_WIDTH - 1) / fraction) - 1);
  while (!shouldWrapWidget(layout, column)) column++;
  return column;
}

/** Whether this snap fraction (1 = full width) is offered in a text column of this width (unmeasured: all). */
function offeredFraction(fraction: number, columnWidth: number): boolean {
  return fraction >= 1 || !(columnWidth > 0) || Math.round(columnWidth * fraction) >= MIN_WIDGET_WIDTH;
}

/**
 * The allowed widths the editor offers in a text column of this width: those at least
 * MIN_WIDGET_WIDTH wide there. (A widget keeps a stored width that isn't offered.)
 */
export function offeredWidths(columnWidth: number): string[] {
  return ALLOWED_WIDGET_WIDTHS.filter(width => offeredFraction(parseFloat(width) / 100, columnWidth));
}

/** The snap fractions a resize offers in a text column of this width (full width always). */
export function offeredSnapFractions(columnWidth: number): number[] {
  return SNAP_FRACTIONS.filter(fraction => offeredFraction(fraction, columnWidth));
}

/** The allowed widths that wrap in a text column of this width. */
export function wrappableWidths(columnWidth: number): string[] {
  return ALLOWED_WIDGET_WIDTHS.filter(width => shouldWrapWidget({ position: 'left', width }, columnWidth));
}

export function sameLayout(a: IframeWidgetLayout, b: IframeWidgetLayout): boolean {
  return a.position === b.position && a.width === b.width;
}

/** The widget's HTML without its layout tag (the tag only places the frame; the widget never sees it). */
export function stripIframeWidgetLayout(srcdoc: string): string {
  return srcdoc.replace(new RegExp(LAYOUT_META_RE.source + '\\n?', 'i'), '');
}

/** The widget's HTML with its layout tag set to `layout` (no tag for a plain inline widget). */
export function setIframeWidgetLayout(srcdoc: string, layout: IframeWidgetLayout): string {
  const html = stripIframeWidgetLayout(srcdoc);
  if (layout.position === 'inline' && !layout.width) return html;
  const settings = [`position=${layout.position}`, layout.width && `width=${layout.width}`].filter(Boolean).join(' ');
  return `<meta name="lw-layout" content="${settings}">\n${html}`;
}
