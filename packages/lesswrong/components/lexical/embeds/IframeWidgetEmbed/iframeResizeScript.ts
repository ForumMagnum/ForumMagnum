/**
 * Auto-resize script injected into iframe widget srcdoc at render time.
 * Uses ResizeObserver + postMessage to communicate content height to the parent.
 * This script is NOT stored in user content — it's injected by the editor component
 * and the reader-side WrappedIframeWidget component.
 */

const RESIZE_SCRIPT = `<script>
(function() {
  function postHeight() {
    var h = document.documentElement.scrollHeight;
    parent.postMessage({ type: 'iframe-widget-resize', height: h }, '*');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', postHeight);
  } else {
    postHeight();
  }
  if (typeof ResizeObserver !== 'undefined') {
    var raf;
    new ResizeObserver(function() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(postHeight);
    }).observe(document.documentElement);
  }
  window.addEventListener('resize', postHeight);
})();
</script>`;

export function injectResizeScript(htmlCode: string): string {
  // Always append rather than trying to inject before </body> or </html>.
  // String replacement is unsafe: if "</body>" appears inside a <script> block
  // or string literal, the injected </script> tag would prematurely close the
  // user's script, breaking their code. Appending after the end is safe because
  // browsers implicitly re-open <body> for any trailing content.
  return htmlCode + RESIZE_SCRIPT;
}
