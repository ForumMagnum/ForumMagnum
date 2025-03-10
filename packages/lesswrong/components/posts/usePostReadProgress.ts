import { useEffect, useRef } from "react";
import { getClamper } from "../../lib/utils/mathUtils";
import { getOffsetChainTop } from '@/lib/utils/domUtil';

interface UsePostReadProgressProps {
  /**
   * Accepts a ref for a progress bar and a "progress" percentage.
   * Should update the ref's styling (or whatever) to correspond to the progress %.
   */
  updateProgressBar: (element: HTMLDivElement, progressPercentage: number) => void;

  /**
   * Allow disabling the progress bar, e.g. because LW displays it in a different context than other forums
   */
  disabled?: boolean;

  /**
   * Number of pixels from the top of the post body by which to delay "starting" the progress bar.
   * Primary use case is for the ToC progress bar, where we want it to line up with the ToC landmarks
   * In that case, we need to delay it by 80% of window.innerHeight, since each section's "landmark" position is 20% of window.innerHeight from the top of the viewport,
   * rather than all the way at the bottom (100%).
   */
  delayStartOffset?: number;

  /**
   * Sets the height of the "sliding window" on the progress bar, which should represent the section of the post the user's viewport currently displays
   */
  setScrollWindowHeight?: (element: HTMLDivElement, height: number) => void;

  /**
   * Determines which scroll progress calculation method to use:
   *
   * - If false ("Origina"/"Scrollable distance" method):
   *   Measures scroll progress by how far the viewport bottom has moved from its initial position
   *   (when you're at the top) to the bottom of the post.
   *   The denominator for progress calculation is total scrollable distance (this is less than the post height if the post is taller than the viewport),
   *   if the post starts at the top of the page.
   *   (At the top, even if the viewport already covers half the post, this starts at 0%.)
   * 
   * - If true ("Viewport Bottom" method):
   *   Measures scroll progress by how far the viewport bottom has moved from the top of the post,
   *   relative to the total height of the post. 
   *   (At the top, if the viewport already covers half the post, this starts at 50%.)
   */
  useFixedToCScrollCalculation?: boolean;
}

const clampPct = getClamper(0, 100);

export const usePostReadProgress = ({ 
  updateProgressBar, 
  disabled = false, 
  delayStartOffset = 0, 
  setScrollWindowHeight, 
  useFixedToCScrollCalculation = true 
}: UsePostReadProgressProps) => {
  const readingProgressBarRef = useRef<HTMLDivElement|null>(null);

  /**
   * Original method for calculating scroll percentage
   * Based on post body bottom position relative to viewport
   */
  const getOriginalScrollPct = (postBodyElement: HTMLElement, offset: number, clamp = true): number => {
    // position of post body bottom relative to the bottom of the viewport
    const postBodyBottomPos = postBodyElement.getBoundingClientRect().bottom - window.innerHeight;
    // total distance from top of page to post body bottom
    const totalHeight = window.scrollY + postBodyBottomPos;
  
    const scrollPercent = (1 - ((postBodyBottomPos + offset) / totalHeight)) * 100;
    const adjustedScrollPercent = clamp ? clampPct(scrollPercent) : scrollPercent;
    return adjustedScrollPercent;
  }

  /**
   * New method for calculating scroll percentage
   * Calculates what percentage of the post has been scrolled through
   * Uses the bottom of the viewport as the reference point
   * @returns A value between 0-100 representing percentage of post that's been scrolled, unless clamp=false
   */
  const getFixedToCScrollPct = (
    postBodyElement: HTMLElement,
    clamp = true
  ): number => {
    const containerTop = getOffsetChainTop(postBodyElement); 
    const containerHeight = postBodyElement.offsetHeight;
    const bottomOfViewport = window.scrollY + window.innerHeight;

    const distanceFromPostTopToViewportBottom = bottomOfViewport - containerTop;
    const scrollPercent = (distanceFromPostTopToViewportBottom / containerHeight) * 100;

    if (clamp) {
      return clampPct(scrollPercent);
    }
    return scrollPercent;
  }
  
  /**
   * Chooses between original and fixed ToC scroll percentage calculation methods
   * based on the useFixedToCScrollCalculation parameter
   */
  const getScrollPct = (postBodyElement: HTMLElement, clamp = true): number => {
    if (useFixedToCScrollCalculation) {
      return getFixedToCScrollPct(postBodyElement, clamp);
    } else {
      return getOriginalScrollPct(postBodyElement, delayStartOffset, clamp);
    }
  }
  
  /**
   * What percent of the post body's height is revealed within the window viewport.
   * We want to show "scroll window" that's proportionally large, relative to the height of the entire progress bar container.
   * @returns The height the scrollbar indicator should be in pixels
   */
  const getScrollWindowHeight = (postBodyElement: HTMLElement, readingProgressBarContainerElement: HTMLElement) => {
    const postRect = postBodyElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const tocHeight = readingProgressBarContainerElement.getBoundingClientRect().height;
    
    // If post is smaller than viewport, the window should be 100% of the TOC height
    if (postRect.height <= viewportHeight) {
      return { displayedWindowScrollHeight: tocHeight };
    }
    
    // Calculate how much of the post is actually visible in the viewport
    const visibleTop = Math.max(0, Math.min(viewportHeight, postRect.top));
    const visibleBottom = Math.max(0, Math.min(viewportHeight, postRect.bottom));
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visiblePostPortion = visibleHeight / postRect.height;
    
    // Calculate how tall the indicator should be proportionally in the ToC
    // We ensure a minimum size of 10px to keep it visible
    const displayedWindowScrollHeight = Math.max(10, visiblePostPortion * tocHeight);
    
    return { displayedWindowScrollHeight };
  }

  const updateReadingProgressBar = (postBodyElement: HTMLElement | null) => {
    if (!postBodyElement || !readingProgressBarRef.current) return;

    const scrollPercent = getScrollPct(postBodyElement);

    updateProgressBar(readingProgressBarRef.current, scrollPercent);
  };

  const updateWindowHeight = (postBodyElement: HTMLElement | null) => {
    if (!postBodyElement || !readingProgressBarRef.current || !setScrollWindowHeight) return;

    const { displayedWindowScrollHeight } = getScrollWindowHeight(postBodyElement, readingProgressBarRef.current);

    setScrollWindowHeight(readingProgressBarRef.current, displayedWindowScrollHeight);
  };

  useEffect(() => {
    const postBodyRef = document.getElementById('postBody') ?? document.getElementById('tagContent');
    if (disabled) return;

    const updateFunc = () => {
      updateReadingProgressBar(postBodyRef);
      updateWindowHeight(postBodyRef);
    }
    updateFunc();
    window.addEventListener('scroll', updateFunc);

    return () => {
      window.removeEventListener('scroll', updateFunc);
    };
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return { readingProgressBarRef };
};
