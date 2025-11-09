import React, { useEffect, useState, useRef } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";;
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react-dom';
import FormatDate from "@/components/common/FormatDate";
import { commentBodyStyles } from "@/themes/stylePiping";
import Link from "next/link";
import { Row } from "@/components/common/Row";
import { useTheme } from "@/components/themes/useTheme";


const styles = defineStyles("GlobePopup", (theme: ThemeType) => ({
  popupContainer: {
    ...commentBodyStyles(theme),
    background: theme.palette.grey[200],
    borderRadius: '5px !important',
    padding: 10,
    maxWidth: 250,
    position: 'relative',
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none',
    gap: 4,
    textWrap: "balance",
    '&:hover': {
      opacity: 1
    },
  },
  meta: {
    fontWeight: 400,
    fontSize: '1rem',
    opacity: 0.8,
    lineHeight: 1.2,
  }
}));

export const GlobePopup = ({document, screenCoords, onClose}: {
  document: PostsList;
  screenCoords: { x: number; y: number };
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
  const popupRef = useRef<HTMLDivElement>(null);
  const [triangleStyle, setTriangleStyle] = useState<React.CSSProperties>({});
  const theme = useTheme();
  const bgColor = theme.palette.grey[200];

  const { refs, floatingStyles, placement: actualPlacement } = useFloating({
    placement: 'right',
    middleware: [offset(25), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference({
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
    });
  }, [refs, screenCoords.x, screenCoords.y]);

  useEffect(() => {
    if (!popupRef.current) return;
    const popupRect = popupRef.current.getBoundingClientRect();
    const placementSide = actualPlacement.split('-')[0];
    const isVertical = placementSide === 'top' || placementSide === 'bottom';
    const offset = isVertical 
      ? screenCoords.x - popupRect.left 
      : screenCoords.y - popupRect.top;
    const clampedOffset = Math.max(10, Math.min(
      (isVertical ? popupRect.width : popupRect.height) - 10, 
      offset
    ));

    const triangleConfig: Record<string, React.CSSProperties> = {
      right: {
        left: 0,
        top: `${clampedOffset}px`,
        transform: 'translateX(-100%) translateY(-50%)',
        borderWidth: '8px 10px 8px 0',
        borderColor: `transparent ${bgColor} transparent transparent`,
      },
      left: {
        left: '100%',
        top: `${clampedOffset}px`,
        transform: 'translateY(-50%)',
        borderWidth: '8px 0 8px 10px',
        borderColor: `transparent transparent transparent ${bgColor}`,
      }
    };

    setTriangleStyle({
      width: 0,
      height: 0,
      borderStyle: 'solid',
      ...triangleConfig[placementSide],
    });
  }, [actualPlacement, screenCoords.x, screenCoords.y, bgColor]);

  if (!document) return null;

  const startDate = document.startTime ? new Date(document.startTime) : null;
  const endDate = document.endTime ? new Date(document.endTime) : null;
  const areSameDay = startDate && endDate && 
    startDate.toDateString() === endDate.toDateString();
  const endTimeFormat = areSameDay ? "h:mm a" : "MMM D h:mm a";

  return (
    <div
      ref={(node) => {
        refs.setFloating(node);
        popupRef.current = node;
      }}
      style={floatingStyles}
      className={classes.popupContainer}
    >
      <div className={classes.triangle} style={triangleStyle} />
      <Link href={postGetPageUrl(document)} className={classes.link} target="_blank" rel="noopener noreferrer">
        <div>{document.title}</div>
        {(document.startTime || document.endTime) && (
          <Row justifyContent="flex-start" gap={4}>
            {document.startTime && (
              <div className={classes.meta}>
                <em><FormatDate tooltip={false} date={document.startTime} format="MMM D h:mm a" /></em>
              </div>
            )}
            {document.startTime && document.endTime && ' - '}
            {document.endTime && (
              <div className={classes.meta}>
                <em><FormatDate tooltip={false} date={document.endTime} format={endTimeFormat} /></em>
              </div>
            )}
          </Row>
        )}
        {document.location && <div className={classes.meta}>{document.location}</div>}
      </Link>
    </div>
  );
};
