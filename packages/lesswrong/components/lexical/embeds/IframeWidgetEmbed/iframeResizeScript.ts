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
 */

const FIT_STYLE = `<style>
html, body { overflow: hidden !important; height: auto !important; min-height: 0 !important; max-height: none !important; }
</style>`;

const RESIZE_SCRIPT = `<script>
(function() {
  // Zoom the body down if its content is wider than the frame. Measured at zoom 1 each time,
  // so the widget grows back to full size when the frame gets wider again.
  function fitWidth() {
    var body = document.body;
    if (!body) return;
    var root = document.documentElement;
    body.style.zoom = '1';
    var cs = getComputedStyle(body);
    var available = root.clientWidth;
    // The page itself can't scroll, so it reports its own width; ask the body how wide its content is.
    var needed = Math.max(root.scrollWidth,
      body.scrollWidth + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0));
    body.style.zoom = needed > available + 1 ? String(available / needed) : '';
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
    fitWidth();
    parent.postMessage({ type: 'iframe-widget-resize', height: Math.ceil(contentHeight()) }, '*');
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

export const IFRAME_MIN_HEIGHT = 50;
export const IFRAME_MAX_HEIGHT = 5000;
export const IFRAME_DEFAULT_HEIGHT = 400;

export function clampIframeHeight(h: number): number {
  return Math.max(IFRAME_MIN_HEIGHT, Math.min(IFRAME_MAX_HEIGHT, Math.round(h)));
}

export function injectResizeScript(htmlCode: string): string {
  // Always append rather than trying to inject before </body> or </html>.
  // String replacement is unsafe: if "</body>" appears inside a <script> block
  // or string literal, the injected </script> tag would prematurely close the
  // user's script, breaking their code. Appending after the end is safe because
  // browsers implicitly re-open <body> for any trailing content.
  return htmlCode + FIT_STYLE + RESIZE_SCRIPT;
}
