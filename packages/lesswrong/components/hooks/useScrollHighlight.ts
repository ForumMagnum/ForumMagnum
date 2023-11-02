import { useCallback, useEffect, useState } from "react";
import { isServer } from "../../lib/executionEnvironment";

export type ScrollHighlightLandmark = {
  landmarkName: string,
  elementId: string
  position: "topOfElement"|"centerOfElement"|"bottomOfElement",
  offset?: number,
}

/**
 * Takes a list of element IDs (the ID attributes of DOM nodes), sorted by
 * Y-position in the page. Attaches event handlers to listen for scroll
 * events on the page. If `landmarks` is empty, returns null. If the scroll
 * position is above all of the elements passed, returns "above"; if below
 * all of the elements passed, returns "below".
 *
 * (This is mainly used for table of contents.)
 */
export function useScrollHighlight(landmarks: ScrollHighlightLandmark[]): {
  landmarkName: string|"above"|"below"|null
} {
  const [currentLandmark,setCurrentSection] = useState<string|null>(null);

  const getCurrentSection = useCallback((): string|null => {
    if (isServer)
      return null;
    if (!landmarks)
      return null;

    // The current section is whichever section a spot 1/3 of the way down the
    // window is inside. So the selected section is the section whose heading's
    // Y is as close to the 1/3 mark as possible without going over.
    let currentSectionMark = getCurrentSectionMark();

    let current = "above";
    for(let i=0; i<landmarks.length; i++)
    {
      let sectionY = getLandmarkY(landmarks[i]);

      if(sectionY && sectionY < currentSectionMark)
        current = landmarks[i].elementId;
    }

    return current;
  }, [landmarks]);

  const updateHighlightedSection = useCallback(() => {
    let newCurrentSection = getCurrentSection();
    setCurrentSection(newCurrentSection);
  }, [getCurrentSection]);

  useEffect(() => {
    window.addEventListener('scroll', updateHighlightedSection);
    updateHighlightedSection();
    
    return () => {
      window.removeEventListener('scroll', updateHighlightedSection);
    };
  }, [updateHighlightedSection]);
  
  return {
    landmarkName: currentLandmark
  };
}

/**
 * Return the screen-space current section mark - that is, the spot on the
 * screen where the current-post will transition when its heading passes.
 */
export const getCurrentSectionMark = () => {
  return window.innerHeight/5
}

// Return the screen-space Y coordinate of an anchor. (Screen-space meaning
// if you've scrolled, the scroll is subtracted from the effective Y
// position.)
export const getLandmarkY = (landmark: ScrollHighlightLandmark): number|null => {
  let anchor = window.document.getElementById(landmark.elementId);
  if (!anchor) {
    return null;
  }
  let anchorBounds = anchor.getBoundingClientRect();
  let offset = landmark.offset ?? 0;
  
  switch (landmark.position) {
    default:
    case "topOfElement":
      return anchorBounds.top + offset;
    case "centerOfElement":
      return anchorBounds.top + (anchorBounds.height/2) + offset;
    case "bottomOfElement":
      return anchorBounds.bottom + offset;
  }
}
