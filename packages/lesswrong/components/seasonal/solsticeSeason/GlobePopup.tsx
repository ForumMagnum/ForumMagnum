import React, { useEffect, useMemo, useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";;
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react-dom';
import type { VirtualElement } from '@floating-ui/dom';
import FormatDate from "@/components/common/FormatDate";
import { commentBodyStyles } from "@/themes/stylePiping";
import Link from "next/link";
import { Row } from "@/components/common/Row";


const styles = defineStyles("GlobePopup", (theme: ThemeType) => ({
  popupContainer: {
    ...commentBodyStyles(theme),
    background: `light-dark(${theme.palette.grey[900]}, ${theme.palette.grey[100]})`,
    borderRadius: '5px !important',
    color: theme.palette.text.alwaysWhite,
    padding: 10,
    maxWidth: 250
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none',
    gap: 6,
    textWrap: "balance",
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      color: theme.palette.primary.dark,
      opacity: 0.8,
    },
  },
  meta: {
    fontWeight: 400,
    fontSize: '1rem',
    opacity: 0.8,
  }
}));

export const GlobePopup = ({document, screenCoords, onClose}: {
  document: PostsList;
  screenCoords: { x: number; y: number };
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
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

  const areSameDay = document.startTime && document.endTime && (() => {
    const start = new Date(document.startTime);
    const end = new Date(document.endTime);
    return start.getFullYear() === end.getFullYear() &&
           start.getMonth() === end.getMonth() &&
           start.getDate() === end.getDate();
  })();

  const endTimeFormat = areSameDay ? "h:mm a" : "MMM D, YYYY h:mm a";

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={classes.popupContainer}
    >
      <Link href={postGetPageUrl(document)} className={classes.link}>
        <div>{document.title}</div>
        <Row justifyContent="flex-start" gap={4}>
          {document.startTime && <div className={classes.meta}><em><FormatDate tooltip={false} date={document.startTime} format="MMM D h:mm a" /></em></div>} - 
          {document.endTime && <div className={classes.meta}><em><FormatDate tooltip={false} date={document.endTime} format={endTimeFormat} /></em></div>}
        </Row>
          {document.location && <div className={classes.meta}>{document.location}</div>}
      </Link>
    </div>
  );
};
