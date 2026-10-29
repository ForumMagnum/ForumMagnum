/**
 * Auto-resize script injected into iframe widget srcdoc at render time.
 * Uses ResizeObserver + postMessage to communicate content height to the parent.
 * This script is NOT stored in user content — it's injected by the editor component
 * and the reader-side HydratedIframeWidget component.
 *
 * EXPERIMENT (experiment/iframe-layout-ronny): widgets never show scrollbars, and their content
 * always fits. The page and body can't scroll or be given a fixed height; the frame grows to the
 * full height of the content (including anything positioned outside the body's flow); and content
 * wider than the frame is zoomed down to fit instead of scrolling sideways.
 *
 * EXPERIMENT (experiment/iframe-layout-ronny-exp2): with `measure` (the drag editor only), each message
 * also reports that zoom and how small the widget's smallest text shows, so the editor can warn the
 * author when a width leaves the widget too small (see IframeWidgetFit).
 */

// EXPERIMENT (experiment/iframe-layout-ronny-exp3): the content sits 1px inside the frame on every side.
// At a fractional zoom (90% on a 2x screen, say) a frame's edges fall between device pixels, and Chrome
// trims the partial pixel at the frame's edge: a border drawn at the widget's edge showed a third thinner
// on the right than on the left (Ronny, Oct 29 2026). That pixel now falls in the 1px gap instead.
const FIT_STYLE = `<style>
html, body { overflow: hidden !important; height: auto !important; min-height: 0 !important; max-height: none !important; }
html { padding: 1px !important; }
</style>`;

function resizeScript(measure: boolean): string {
  return `<script>
(function() {
  var MEASURE = ${measure ? 'true' : 'false'};
  // The smallest text in px at zoom 1, counting text in an SVG at the size its drawing shows it (a
  // chart stretched to fit its box shrinks its labels with it). Stops looking after 4000 elements.
  function smallestText() {
    var min = Infinity, inDrawing = false, checked = 0, last = null;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (checked < 4000 && walker.nextNode()) {
      var el = walker.currentNode.parentElement;
      if (!el || el === last || !walker.currentNode.nodeValue.trim()) continue;
      last = el;
      checked++;
      if (el.closest('script, style, noscript, template, title')) continue;
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || !el.getClientRects().length) continue;
      var size = parseFloat(cs.fontSize);
      var svg = el instanceof SVGElement && typeof el.getScreenCTM === 'function';
      if (svg) {
        var m = el.getScreenCTM();
        if (m) size *= Math.hypot(m.a, m.b);
      }
      if (size > 0 && size < min) { min = size; inDrawing = svg; }
    }
    return min === Infinity ? null : { size: min, inDrawing: inDrawing };
  }
  // Zoom the body down if its content is wider than the frame. Measured at zoom 1 each time,
  // so the widget grows back to full size when the frame gets wider again.
  function fitWidth() {
    var body = document.body;
    var root = document.documentElement;
    body.style.zoom = '1';
    var cs = getComputedStyle(body);
    var rootStyle = getComputedStyle(root);
    // The page's own padding (the 1px inset in FIT_STYLE) isn't room for content.
    var inset = (parseFloat(rootStyle.paddingLeft) || 0) + (parseFloat(rootStyle.paddingRight) || 0);
    var available = root.clientWidth - inset;
    // The page itself can't scroll, so it reports its own width; ask the body how wide its content is.
    var needed = Math.max(root.scrollWidth - inset,
      body.scrollWidth + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0));
    var zoom = needed > available + 1 ? available / needed : 1;
    var text = MEASURE ? smallestText() : null;
    body.style.zoom = zoom < 1 ? String(zoom) : '';
    return { width: root.clientWidth, zoom: zoom, text: text };
  }
  function contentHeight() {
    var body = document.body;
    var cs = getComputedStyle(body);
    var bottom = body.getBoundingClientRect().bottom + (parseFloat(cs.marginBottom) || 0);
    for (var i = 0; i < body.children.length; i++) {
      bottom = Math.max(bottom, body.children[i].getBoundingClientRect().bottom);
    }
    return Math.max(bottom + window.scrollY, document.documentElement.getBoundingClientRect().height);
  }
  function postHeight() {
    if (!document.body) return;
    var fit = fitWidth();
    var message = { type: 'iframe-widget-resize', height: Math.ceil(contentHeight()) };
    if (MEASURE) {
      message.fit = {
        width: fit.width,
        zoom: fit.zoom,
        minText: fit.text ? fit.text.size * fit.zoom : null,
        minTextInDrawing: !!(fit.text && fit.text.inDrawing),
      };
    }
    parent.postMessage(message, '*');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', postHeight);
  } else {
    postHeight();
  }
  window.addEventListener('load', postHeight);
  if (typeof ResizeObserver !== 'undefined') {
    var raf;
    new ResizeObserver(function() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(postHeight);
    }).observe(document.documentElement);
  }
  window.addEventListener('message', function(event) {
    if (event.data?.type === 'iframe-widget-request-resize') {
      postHeight();
    }
  });
  window.addEventListener('resize', postHeight);
})();
</script>`;
}

const RESIZE_SCRIPT = resizeScript(false);
const MEASURING_RESIZE_SCRIPT = resizeScript(true);

export const IFRAME_MIN_HEIGHT = 50;
export const IFRAME_MAX_HEIGHT = 5000;
export const IFRAME_DEFAULT_HEIGHT = 400;

export function clampIframeHeight(h: number): number {
  return Math.max(IFRAME_MIN_HEIGHT, Math.min(IFRAME_MAX_HEIGHT, Math.round(h)));
}

export function injectResizeScript(htmlCode: string, options: { measure?: boolean } = {}): string {
  // Always append rather than trying to inject before </body> or </html>.
  // String replacement is unsafe: if "</body>" appears inside a <script> block
  // or string literal, the injected </script> tag would prematurely close the
  // user's script, breaking their code. Appending after the end is safe because
  // browsers implicitly re-open <body> for any trailing content.
  return htmlCode + FIT_STYLE + (options.measure ? MEASURING_RESIZE_SCRIPT : RESIZE_SCRIPT);
}

/** EXPERIMENT (experiment/iframe-layout-ronny-exp2): what a measuring frame reports with its height. */
export interface IframeWidgetFit {
  /** The frame's width (px) when it measured. */
  width: number;
  /** How far the widget was zoomed down to fit (1: not at all). */
  zoom: number;
  /** The smallest text as shown (px, after the zoom), or null for a widget with no text. */
  minText: number | null;
  /** That text is in an SVG drawing stretched to fit (a chart's labels, say). */
  minTextInDrawing: boolean;
}

/** The fit in a resize message, or null if it has none (or a widget's own message got it wrong). */
export function readIframeWidgetFit(data: unknown): IframeWidgetFit | null {
  const fit = (data && typeof data === 'object') ? (data as { fit?: unknown }).fit : null;
  if (!fit || typeof fit !== 'object') return null;
  const { width, zoom, minText, minTextInDrawing } = fit as Record<string, unknown>;
  const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
  if (!finite(width) || !finite(zoom) || zoom <= 0) return null;
  return {
    width,
    zoom: Math.min(1, zoom),
    minText: finite(minText) && minText > 0 ? minText : null,
    minTextInDrawing: minTextInDrawing === true,
  };
}
