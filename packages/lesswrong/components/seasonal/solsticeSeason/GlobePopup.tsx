import React, { useEffect, useState, useMemo } from "react";
import { useStyles } from "@/components/hooks/useStyles";
import GroupLinks from "@/components/localGroups/GroupLinks";
import { StyledMapPopupContent } from "@/components/localGroups/StyledMapPopup";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { fixedPositionEventPopupStyles } from "../HomepageMap/HomepageCommunityMap";
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react-dom';
import type { VirtualElement } from '@floating-ui/dom';


export const GlobePopup = ({document, screenCoords, onClose}: {
  document: PostsList;
  screenCoords: { x: number; y: number };
  onClose: () => void;
}) => {
  const fixedPopupClasses = useStyles(fixedPositionEventPopupStyles);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Place popup on right if marker is far from right edge (>10vw), otherwise on left
  const placement = useMemo(() => {
    const distanceFromRight = windowWidth - screenCoords.x;
    return distanceFromRight > windowWidth * 0.1 ? 'right' : 'left';
  }, [windowWidth, screenCoords.x]);

  const { refs, floatingStyles } = useFloating({
    placement,
    middleware: [
      offset(10), // 10px offset from the marker
      flip(), // Flip to opposite side if not enough space
      shift({ padding: 8 }), // Shift to keep within viewport with 8px padding
    ],
    whileElementsMounted: (reference, floating, update) => {
      return autoUpdate(reference, floating, update);
    },
  });

  // Set virtual reference element from screen coordinates
  useEffect(() => {
    const virtualElement: VirtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: screenCoords.x,
        y: screenCoords.y,
        top: screenCoords.y,
        left: screenCoords.x,
        right: screenCoords.x,
        bottom: screenCoords.y,
      }),
    };
    refs.setReference(virtualElement);
  }, [refs, screenCoords.x, screenCoords.y]);

  if (!document) return null;

  const { htmlHighlight = "" } = document.contents || {};
  const htmlBody = {__html: htmlHighlight};

  return (
    <div
      ref={refs.setFloating}
      className={fixedPopupClasses.popupContainer}
      style={floatingStyles}
    >
      <button className={fixedPopupClasses.popupCloseButton} onClick={onClose}>
        ×
      </button>
      <StyledMapPopupContent
        link={postGetPageUrl(document)}
        title={` [Event] ${document.title} `}
        metaInfo={document.contactInfo}
        cornerLinks={<GroupLinks document={document}/>}
      >
        <div dangerouslySetInnerHTML={htmlBody} />
      </StyledMapPopupContent>
    </div>
  );
};
