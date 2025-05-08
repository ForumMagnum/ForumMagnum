import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from 'classnames';

export const SCROLL_INDICATOR_SIZE = 13;

const styles = (theme: ThemeType) => ({
  scrollIndicatorWrapper: {
    display: "block",
    position: "relative",
    maxWidth: "100% !important",
    
    paddingLeft: SCROLL_INDICATOR_SIZE,
    paddingRight: SCROLL_INDICATOR_SIZE,
  },
  
  scrollIndicator: {
    position: "absolute",
    top: "50%",
    marginTop: -28,
    cursor: "pointer",
    
    // Scroll arrows use the CSS Triangle hack - see
    // https://css-tricks.com/snippets/css/css-triangle/ for a full explanation
    borderTop: "20px solid transparent",
    borderBottom: "20px solid transparent",
  },
  
  scrollIndicatorLeft: {
    left: 0,
    borderRight: `10px solid ${theme.palette.grey[310]}`,
    
    "&:hover": {
      borderRight: `10px solid ${theme.palette.grey[620]}`,
    },
  },
  
  scrollIndicatorRight: {
    right: 0,
    borderLeft: `10px solid ${theme.palette.grey[310]}`,
    
    "&:hover": {
      borderLeft: `10px solid ${theme.palette.grey[620]}`,
    },
  },

  scrollableContents: {
    overflowX: "auto",
    overflowY: "hidden",

    // Cancel out the margin created by the block elements above and below,
    // so that we can convert them into padding and get a larger touch
    // target.
    // !important to take precedence over .mjx-chtml
    marginTop: "-1em !important",
    marginBottom: "-1em !important",
    
    paddingTop: "2em !important",
    paddingBottom: "2em !important",
    
    // Hide the scrollbar (on browsers that support it) because our scroll
    // indicator is better
    "-ms-overflow-style": "-ms-autohiding-scrollbar",
    "&::-webkit-scrollbar": {
      display: "none",
    },
    scrollbarWidth: "none",
  },
  
  hidden: {
    display: "none !important",
  },
})

const HorizScrollBlockInner = ({children, className, contentsClassName, classes}: {
  children: ReactNode
  className?: string,
  contentsClassName?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const scrollableContentsRef = useRef<HTMLDivElement>(null);
  const [isScrolledAllTheWayLeft, setIsScrolledAllTheWayLeft] = useState(true);
  const [isScrolledAllTheWayRight, setIsScrolledAllTheWayRight] = useState(false);
  
  const updateScrollBounds = useCallback(() => {
    if (scrollableContentsRef.current) {
      const scrollLeft = scrollableContentsRef.current.scrollLeft;
      setIsScrolledAllTheWayLeft((scrollLeft===0));
      setIsScrolledAllTheWayRight((
        scrollLeft === scrollableContentsRef.current.scrollWidth - scrollableContentsRef.current.clientWidth
      ));
    }
  }, []);
  
  useEffect(() => {
    updateScrollBounds();
  }, [updateScrollBounds]);

  return <div className={classNames(classes.scrollIndicatorWrapper, className)}>
    <div
      className={classNames(
        classes.scrollIndicator, classes.scrollIndicatorLeft,
        {[classes.hidden]: isScrolledAllTheWayLeft},
      )}
      onClick={_ev => {
        const block = scrollableContentsRef.current!;
        block.scrollLeft = Math.max(block.scrollLeft - block.clientWidth, 0);
      }}
    />
    <div
      className={classNames(classes.scrollableContents, contentsClassName)}
      ref={scrollableContentsRef}
      onScroll={updateScrollBounds}
    >
      {children}
    </div>
    <div
      onClick={_ev => {
        const block = scrollableContentsRef.current!;
        block.scrollLeft += Math.min(
          block.scrollLeft + block.clientWidth,
          block.scrollWidth - block.clientWidth
        );
      }}
      className={classNames(
        classes.scrollIndicator, classes.scrollIndicatorRight,
        {[classes.hidden]: isScrolledAllTheWayRight},
      )}
    />
  </div>
}

export const HorizScrollBlock = registerComponent(
  'HorizScrollBlock',
  HorizScrollBlockInner,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    HorizScrollBlock: typeof HorizScrollBlock
  }
}

