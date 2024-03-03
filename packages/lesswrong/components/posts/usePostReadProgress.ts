import { useEffect, useRef } from "react";
import { getClamper } from "../../lib/utils/mathUtils";

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

  setScrollWindowHeight?: (element: HTMLDivElement, height: number, marginTop: number) => void;
}

const clampPct = getClamper(0, 1);

export const usePostReadProgress = ({ updateProgressBar, disabled = false, delayStartOffset = 0, setScrollWindowHeight }: UsePostReadProgressProps) => {
  const readingProgressBarRef = useRef<HTMLDivElement|null>(null);

  const getScrollPct = (postBodyElement: HTMLElement, delayStartOffset: number) => {
    // position of post body bottom relative to the bottom of the viewport
    const postBodyBottomPos = postBodyElement.getBoundingClientRect().bottom - window.innerHeight;
    // total distance from top of page to post body bottom
    const totalHeight = window.scrollY + postBodyBottomPos;
  
    const scrollPercent = clampPct(1 - ((postBodyBottomPos + delayStartOffset) / totalHeight));
    return scrollPercent * 100;
  }
  
  const getScrollWindowHeight = (postBodyElement: HTMLElement, readingProgressBarContainerElement: HTMLElement) => {
    const postBodyHeight = postBodyElement.getBoundingClientRect().height;
    const windowHeight = window.innerHeight;
    
    /**
     * What percent of the post body's height is revealed within the window viewport.
     * We want to show "scroll window" that's proportionally large, relative to the height of the entire progress bar container.
     */
    const windowBodyPercent = clampPct(windowHeight / postBodyHeight) * 100;
    const containerHeight = readingProgressBarContainerElement.getBoundingClientRect().height;
    const absoluteScrollWindowHeight = (windowBodyPercent / 100) * containerHeight;

    const currentScrollPct = getScrollPct(postBodyElement, delayStartOffset);

    const displayedScrollWindowPercent = currentScrollPct / windowBodyPercent;
    const displayedWindowScrollHeight = absoluteScrollWindowHeight * clampPct(displayedScrollWindowPercent);
    const marginTop = displayedScrollWindowPercent >= 1
      ? Math.max((containerHeight * (currentScrollPct / 100)) - (absoluteScrollWindowHeight / 2), 0) // (absoluteScrollWindowHeight * clampPct(displayedScrollWindowPercent - 1))
      : 0
    // displayedScrollWindowPercent >= 1
    //   ? (containerHeight * (currentScrollPct / 100)) - (absoluteScrollWindowHeight * clampPct(displayedScrollWindowPercent - 1))
    //   : 0;
    return { marginTop, displayedWindowScrollHeight };

    // const scrollPct = getScrollPct(postBodyElement, delayStartOffset);
    // const percentOfProgressBar = percentOfContainer / (scrollPct / 100);

    // return percentOfProgressBar;
  }

  const updateReadingProgressBar = (postBodyElement: HTMLElement | null) => {
    if (!postBodyElement || !readingProgressBarRef.current) return;

    const scrollPercent = getScrollPct(postBodyElement, delayStartOffset);

    updateProgressBar(readingProgressBarRef.current, scrollPercent);
  };

  const updateWindowHeight = (postBodyElement: HTMLElement | null) => {
    if (!postBodyElement || !readingProgressBarRef.current || !setScrollWindowHeight) return;

    const { marginTop, displayedWindowScrollHeight } = getScrollWindowHeight(postBodyElement, readingProgressBarRef.current);

    setScrollWindowHeight(readingProgressBarRef.current, displayedWindowScrollHeight, marginTop);
  };

  useEffect(() => {
    const postBodyRef = document.getElementById('postBody');
    if (disabled) return;

    const updateFunc = () => {
      updateReadingProgressBar(postBodyRef);
      updateWindowHeight(postBodyRef);
    }
    updateFunc();
    window.addEventListener('scroll', updateFunc);

    // updateWindowHeight(postBodyRef);

    return () => {
      window.removeEventListener('scroll', updateFunc);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return { readingProgressBarRef };
};
