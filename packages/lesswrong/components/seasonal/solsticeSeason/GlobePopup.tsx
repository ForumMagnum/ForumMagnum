import React from "react";
import { useStyles } from "@/components/hooks/useStyles";
import GroupLinks from "@/components/localGroups/GroupLinks";
import { StyledMapPopupContent } from "@/components/localGroups/StyledMapPopup";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { useEffect } from "react";
import { fixedPositionEventPopupStyles } from "../HomepageMap/HomepageCommunityMap";
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react-dom';


export const GlobePopup = ({document, screenCoords, onClose}: {
  document: PostsList;
  screenCoords: { x: number; y: number };
  onClose: () => void;
}) => {
  const fixedPopupClasses = useStyles(fixedPositionEventPopupStyles);

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [
      offset(10), // 10px offset from the marker
      flip(), // Flip to bottom if not enough space on top
      shift({ padding: 8 }), // Shift to keep within viewport with 8px padding
    ],
    whileElementsMounted: (reference, floating, update) => {
      return autoUpdate(reference, floating, update);
    },
  });

  // Set virtual reference element from screen coordinates
  useEffect(() => {
    const virtualElement = {
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
    refs.setReference(virtualElement as any);
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
