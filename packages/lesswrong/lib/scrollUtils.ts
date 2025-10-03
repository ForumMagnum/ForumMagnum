import { isProduction, isServer } from "./executionEnvironment";
import { commentPermalinkStyleSetting } from './instanceSettings';

export type ScrollHighlightLandmark = {
  landmarkName: string;
  elementId: string;
  position: "topOfElement" | "centerOfElement" | "bottomOfElement";
  offset?: number;
};

/**
 * For use with tables of contents (with useScrollHighlight). Return the screen-space current section
 * mark - that is, the spot on the screen where the current-post will transition when its heading passes.
 */
export const getCurrentSectionMark = () => {
  if (isServer) return 0;
  return window.innerHeight / 5;
};

/**
 * Return the screen-space Y coordinate of an anchor. (Screen-space meaning
 * if you've scrolled, the scroll is subtracted from the effective Y
 * position.)
 */
export const getLandmarkY = (landmark: ScrollHighlightLandmark, anchor?: HTMLElement): number | null => {
  const anchorElement = anchor ?? window.document.getElementById(landmark.elementId);

  if (!anchorElement) {
    return null;
  }

  if (anchorElement.id !== landmark.elementId) {
    throw new Error(
      `Anchor element ID does not match the landmark element ID: expected ${landmark.elementId}, but got ${anchorElement.id}`
    );
  }
  const anchorBounds = anchorElement.getBoundingClientRect();
  const offset = landmark.offset ?? 0;

  switch (landmark.position) {
    default:
    case "topOfElement":
      return anchorBounds.top + offset;
    case "centerOfElement":
      return anchorBounds.top + (anchorBounds.height / 2) + offset;
    case "bottomOfElement":
      return anchorBounds.bottom + offset;
  }
};

/**
 * The landmark on the page (in screen space, i.e. relative to the viewport) of the element
 * with this id. Intended for use with comments, a good starting point for other elements too.
 */
export function commentIdToLandmark(commentId: string): ScrollHighlightLandmark {
  return {
    landmarkName: commentId,
    elementId: commentId,
    position: "topOfElement",
    offset: 25, //approximate distance from top-border of a comment to the center of the metadata line
  }
}

function calculateCommentScrollTop(element: HTMLElement): number;
function calculateCommentScrollTop(id: string): number;
function calculateCommentScrollTop(input: HTMLElement | string): number {
  let element: HTMLElement | null;
  if (typeof input === "string") {
    element = document.getElementById(input);
    if (!element) {
      // It's the responsibility of the caller to check the element exists
      return 0;
    }
  } else {
    element = input;
  }

  const elemTop = getLandmarkY(commentIdToLandmark(element.id));
  if (elemTop === null) {
    throw new Error(`Could not calculate position for element with id ${element.id}`);
  }
  return elemTop + window.scrollY - getCurrentSectionMark() + 1;
}

let currentScrollFocus: {
  cleanup: () => void;
} | null = null;

/**
 * To handle layout shift after scroll: Re-scroll to the given element until any user-initiated
 * input events occur, 5s passes, or the element is removed from the DOM
 *
 * @param id The `id` attribute of the element
 */
export function scrollFocusOnElement({ id, options = {} }: { id: string; options?: ScrollToOptions }) {
  window.killPreloadScroll?.();

  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  // Clean up any existing scroll focus
  if (currentScrollFocus) {
    currentScrollFocus.cleanup();
    currentScrollFocus = null;
  }

  let targetScrollTop = calculateCommentScrollTop(element);

  // Initial scroll
  // Note: Currently this is calibrated for comments, although the default offset for comments is a good
  // first guess for any element
  window.scrollTo({ top: targetScrollTop, ...options });

  // Local ref required because functions using cleanup need to
  // be defined before cleanup is instantiated
  const ref = {
    cleanup: () => {},
  };

  const observer = new MutationObserver(() => {
    // Check if the element is still in the DOM
    if (!element.isConnected) {
      ref.cleanup();
      return;
    }

    const newScrollTop = calculateCommentScrollTop(element);

    if (Math.abs(newScrollTop - targetScrollTop) <= 40) {
      return;
    }

    targetScrollTop = newScrollTop;

    // Override initial behaviour and just scroll instantly if re-scrolling, to avoid intertia resetting
    window.scrollTo({ top: targetScrollTop, ...options, behavior: "auto"});
  });

  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  const userEventListener = function (_: Event) {
    ref.cleanup();
  };

  // Event listeners for user-initiated actions
  ["mousedown", "keydown", "wheel", "touchstart"].forEach((eventType) => {
    window.addEventListener(eventType, userEventListener, { passive: true });
  });

  ref.cleanup = () => {
    observer.disconnect();
    ["mousedown", "keydown", "wheel", "touchstart"].forEach((eventType) => {
      window.removeEventListener(eventType, userEventListener);
    });

    // Clear currentScrollFocus if it's still pointing to this instance
    if (currentScrollFocus && currentScrollFocus.cleanup === ref.cleanup) {
      currentScrollFocus = null;
    }
  };

  setTimeout(ref.cleanup, 5000);

  currentScrollFocus = {
    cleanup: ref.cleanup,
  };
}

/**
 * Simplified version of `scrollFocusOnElement` to run as a standalone script as soon
 * as the page loads, to speed up interactivity.
 */
export const preloadScrollToCommentScript = `<script>
  try {
    function prettyScrollTo(element) {
      const rect = element.getBoundingClientRect();
      const offset = 25; // See commentIdToLandmark
      const elementY = rect.top + offset;
      const scrollPosition = elementY + window.scrollY - (window.innerHeight / 5) + 1;
      window.scrollTo({ top: scrollPosition });
    }

    // Function to scroll to the comment specified in the query parameter
    function scrollFocusOnQueryComment() {
      const urlParams = new URLSearchParams(window.location.search);
      let commentId = urlParams.get("commentId");

      if (!commentId) {
        const hash = window.location.hash;
        if (hash.startsWith("#")) {
          commentId = hash.substring(1);
        }
      }

      const element = document.getElementById(commentId);
      if (!element) {
        return;
      }

      prettyScrollTo(element);

      const ref = {
        cleanup: function() {}
      };

      const observer = new MutationObserver(function() {
        // Check if the element is still in the DOM
        if (!element.isConnected) {
          ref.cleanup();
          return;
        }

        prettyScrollTo(element);
      });

      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true
      });

      const userEventListener = function() {
        ref.cleanup();
      };

      // Event listeners for user-initiated actions
      ["mousedown", "keydown", "wheel", "touchstart"].forEach(function(eventType) {
        window.addEventListener(eventType, userEventListener, { passive: true });
      });

      ref.cleanup = function() {
        observer.disconnect();
        ["mousedown", "keydown", "wheel", "touchstart"].forEach(function(eventType) {
          window.removeEventListener(eventType, userEventListener);
        });
        window.killPreloadScroll = null;
      };

      // Expose the cleanup function on the window object so the proper version in scrollUtils can take over
      window.killPreloadScroll = ref.cleanup;

      setTimeout(ref.cleanup, 5000);
    }

    scrollFocusOnQueryComment();
  } catch (e) {
    console.error(e)
    if (${!isProduction}) { // Note: condition will be constant in rendered html
      alert("Error in preloaded scrollFocusOnQueryComment script, see renderPage.tsx (this error will only appear on dev).");
    }
  }
</script>`;
