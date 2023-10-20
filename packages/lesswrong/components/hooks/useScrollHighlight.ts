import { useEffect, useState } from "react";
import { isServer } from "../../lib/executionEnvironment";

export type ScrollHighlightLandmark = {
  elementId: string
  position: "topOfElement"|"centerOfElement",
}

export function useScrollHighlight(landmarks: ScrollHighlightLandmark[]): {
  landmarkId: string|null
} {
  const [currentLandmark,setCurrentSection] = useState<string|null>(null);

  // Return the screen-space current section mark - that is, the spot on the
  // screen where the current-post will transition when its heading passes.
  const getCurrentSectionMark = () => {
    return window.innerHeight/3
  }

  const getCurrentSection = (): string|null => {
    if (isServer)
      return null;
    if (!landmarks)
      return null;

    // The current section is whichever section a spot 1/3 of the way down the
    // window is inside. So the selected section is the section whose heading's
    // Y is as close to the 1/3 mark as possible without going over.
    let currentSectionMark = getCurrentSectionMark();

    let current: string|null = null;
    for(let i=0; i<landmarks.length; i++)
    {
      let sectionY = getLandmarkY(landmarks[i]);

      if(sectionY && sectionY < currentSectionMark)
        current = landmarks[i].elementId;
    }

    return current;
  }

  const updateHighlightedSection = () => {
    let newCurrentSection = getCurrentSection();
    if(newCurrentSection !== currentLandmark) {
      setCurrentSection(newCurrentSection);
    }
  }
  useEffect(() => {
    window.addEventListener('scroll', updateHighlightedSection);
    updateHighlightedSection();
    
    return () => {
      window.removeEventListener('scroll', updateHighlightedSection);
    };
  });
  
  return {
    landmarkId: currentLandmark
  };
}

// Return the screen-space Y coordinate of an anchor. (Screen-space meaning
// if you've scrolled, the scroll is subtracted from the effective Y
// position.)
const getLandmarkY = (landmark: ScrollHighlightLandmark): number|null => {
  let anchor = window.document.getElementById(landmark.elementId);
  if (anchor) {
    let anchorBounds = anchor.getBoundingClientRect();
    if (landmark.position==="topOfElement") {
      return anchorBounds.top;
    } else {
      return anchorBounds.top + (anchorBounds.height/2);
    }
  } else {
    return null
  }
}
