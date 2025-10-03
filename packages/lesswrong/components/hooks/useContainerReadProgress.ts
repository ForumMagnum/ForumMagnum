import { useEffect } from "react";
import { getOffsetChainTop } from '@/lib/utils/domUtil';

interface UseContainerReadProgressProps {
  /** Scrollable container whose scroll events we listen to */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Ref to the element inside the ToC that visually represents the progress bar */
  readingProgressBarRef: React.RefObject<HTMLDivElement | null>;
  /** Optional id of the element that contains the post text. Defaults to "postContent". */
  postContentId?: string;
  /** Disable all behaviour of the hook */
  disabled?: boolean;
}

/**
 * Provides reading-progress calculations for situations where the post scrolls inside an
 * element other than `window` (e.g. a modal).  Mirrors the behaviour of `usePostReadProgress`.
 */
export const useContainerReadProgress = ({
  scrollContainerRef,
  readingProgressBarRef,
  postContentId = "postContent",
  disabled = false,
}: UseContainerReadProgressProps) => {
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container || disabled) return;

    const update = () => {
      const postContentElement = document.getElementById(postContentId);
      if (!postContentElement || !readingProgressBarRef.current) return;

      const postContentTop = getOffsetChainTop(postContentElement);
      const postContentHeight = postContentElement.offsetHeight;

      // Progress (0-100) based on how far the viewport bottom has travelled through the post.
      const viewportBottomInContainer = container.scrollTop + container.clientHeight;
      const distanceFromPostTopToViewportBottom = viewportBottomInContainer - postContentTop;
      const scrollPercentRaw = (distanceFromPostTopToViewportBottom / postContentHeight) * 100;
      const clampedTopPercent = Math.max(0, Math.min(100, scrollPercentRaw));
      readingProgressBarRef.current.style.setProperty("--scrollAmount", `${clampedTopPercent}%`);

      // Height of the indicator: portion of the post currently visible (min 10px)
      const progressBarHeight = readingProgressBarRef.current.offsetHeight;
      const viewportTop = container.scrollTop;
      const viewportBottom = viewportTop + container.clientHeight;
      const postBottom = postContentTop + postContentHeight;
      const visibleTop = Math.max(postContentTop, viewportTop);
      const visibleBottom = Math.min(postBottom, viewportBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visiblePostPortion = visibleHeight / postContentHeight;
      const windowHeightInPixels = Math.max(10, visiblePostPortion * progressBarHeight);
      readingProgressBarRef.current.style.setProperty("--windowHeight", `${windowHeightInPixels}px`);
    };

    // Initial update and listener binding
    update();
    container.addEventListener("scroll", update);

    return () => container.removeEventListener("scroll", update);
  }, [scrollContainerRef, readingProgressBarRef, postContentId, disabled]);
}; 
