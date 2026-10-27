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
