import { commentPermalinkStyleSetting } from "@/lib/publicSettings";

/**
 * When refreshing the page, tell the browser to remember the scroll position.
 * Otherwise, users get scrolled to the top of the page.
 * (See https://github.com/Lesswrong2/Lesswrong2/issues/295#issuecomment-385866050)
 */
export function rememberScrollPositionOnPageReload() {
  window.addEventListener("beforeunload", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const commentId = urlParams.get("commentId");

    if ("scrollRestoration" in window.history) {
      const hasInContextComments = commentPermalinkStyleSetting.get() === 'in-context'
      try {
        window.history.scrollRestoration = commentId && hasInContextComments ? "manual" : "auto";
      } catch (e) {
        //eslint-disable-next-line no-console
        console.error(e);
      }
    }
  });
}
