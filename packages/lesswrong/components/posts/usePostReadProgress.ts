import { useEffect, useRef } from "react";

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
}

export const usePostReadProgress = ({ updateProgressBar, disabled = false, delayStartOffset = 0 }: UsePostReadProgressProps) => {
  const readingProgressBarRef = useRef<HTMLDivElement|null>(null);

  const updateReadingProgressBar = (postBodyElement: HTMLElement | null) => {
    if (!postBodyElement || !readingProgressBarRef.current) return;

    // position of post body bottom relative to the bottom of the viewport
    const postBodyBottomPos = postBodyElement.getBoundingClientRect().bottom - window.innerHeight;
    // total distance from top of page to post body bottom
    const totalHeight = window.scrollY + postBodyBottomPos;
    const scrollPercent = (1 - ((postBodyBottomPos + delayStartOffset) / totalHeight)) * 100;

    updateProgressBar(readingProgressBarRef.current, scrollPercent);
  };

  useEffect(() => {
    const postBodyRef = document.getElementById('postBody');
    if (disabled) return;

    const updateFunc = () => updateReadingProgressBar(postBodyRef);
    updateFunc();
    window.addEventListener('scroll', updateFunc);

    return () => {
      window.removeEventListener('scroll', updateFunc);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return { readingProgressBarRef };
};
