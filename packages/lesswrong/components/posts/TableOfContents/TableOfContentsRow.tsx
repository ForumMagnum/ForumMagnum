import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import classNames from 'classnames';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { fullHeightToCEnabled } from '../../../lib/betas';

const sectionOffsetStyling = (fullHeightToCEnabled ? {
  display: 'flex',
  flexDirection: 'column-reverse',
} : {});

const TITLE_CONTAINER_CLASS_NAME = 'ToCTitleContainer';
const FIXED_POSITION_TOC_CLASS_NAME = 'FixedPositionToC-root';
const FIXED_POSITION_NON_SPLASH_PAGE_TOC_CLASS_NAME = 'MultiToCLayout-normalHeaderToc';

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },

  // For the highlighted section only, disable the half-opacity-on-hover effect
  // that's otherwise globally applied to <a> tags.
  highlighted: {
    '& $link': {
      color: theme.palette.link.tocLinkHighlighted,
    },
    '& $highlightDot:after': {
      content: `"•"`,
      marginLeft: 3,
      position: 'relative',
      top: 1
    },
    "& a:focus, & a:hover": {
      opacity: "initial",
    }
  },
  dense: {
    paddingTop: "0 !important",
    paddingBottom: "4px !important",
    fontSize: 12,
  },
  link: {
    display: "block",
    paddingTop: 6,
    paddingBottom: 6,
    color: theme.palette.link.tocLink,
    lineHeight: fullHeightToCEnabled ? "1em" : "1.2em",
    '&:hover':{
      opacity:1,
      color: theme.palette.link.tocLinkHighlighted,
    },
    ...(isFriendlyUI && {
      lineHeight: "1.1rem",
      fontSize: "1rem",
    }),
  },
  highlightDot: {},
  // Makes sure that the start of the ToC is in line with the start of the text
  title: {
    paddingTop: 3,
    paddingBottom: theme.spacing.unit*1.5,
    borderBottom: theme.palette.border.faint,
    fontSize: isFriendlyUI ? "1em" : undefined,
  },
  level0: {
    display:"block",
    maxWidth: '100%',
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    '& $link': {
      whiteSpace: "normal",
    },
    // Don't show location dot for level0
    '& $link:after': {
      display: "none",
    },
    ...sectionOffsetStyling,
  },
  level1: {
    paddingLeft: 0,
    ...sectionOffsetStyling,
  },
  level2: {
    fontSize:"1.1rem",
    paddingLeft: 16,
    ...sectionOffsetStyling,
  },
  level3: {
    fontSize:"1.1rem",
    color: theme.palette.text.dim700,
    paddingLeft: 32,
    ...sectionOffsetStyling,
  },
  level4: {
    fontSize:"1.1rem",
    color: theme.palette.text.dim700,
    paddingLeft: 48,
    ...sectionOffsetStyling,
  },
  titleContainer: {
    height: '100%',
    maxHeight: 200,
    display: 'flex',
    flexDirection: 'column-reverse',
    transition: 'opacity 0.4s ease-in-out, height 0.4s ease-in-out, max-height 0.4s ease-in-out, margin-top 0.4s ease-in-out',
  },
  '@global': isFriendlyUI ? {} : {
    // Hard-coding this class name as a workaround for one of the JSS plugins being incapable of parsing a self-reference ($titleContainer) while inside @global
    [`body:has(.headroom--pinned) .${TITLE_CONTAINER_CLASS_NAME}`]: {
      opacity: 0,
      height: 84,
    },
    [`body:has(.headroom--unfixed) .${FIXED_POSITION_NON_SPLASH_PAGE_TOC_CLASS_NAME} .${FIXED_POSITION_TOC_CLASS_NAME}`]: {
      maxHeight: 'calc(100vh - 64px)',
    }
  }
});

const levelToClassName = (level: number, classes: ClassesType<typeof styles>) => {
  switch(level) {
    case 0: return classes.level0;
    case 1: return classes.level1;
    case 2: return classes.level2;
    case 3: return classes.level3;
    default: return classes.level4;
  }
}

const TableOfContentsRow = ({
  indentLevel=0, highlighted=false, href, onClick, children, classes, title, divider, answer, dense, offset, fullHeight, commentToC
}: {
  indentLevel?: number,
  highlighted?: boolean,
  href: string,
  onClick?: (ev: any) => void,
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
  title?: boolean,
  divider?: boolean,
  answer?: boolean,
  dense?: boolean,
  /**
   * Used to dynamically set `flex` ratios for the full-height ToC
   */
  offset?: number,
  fullHeight?: boolean,
  commentToC?: boolean,
}) => {
  const [isPinned, setIsPinned] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);
  
  const fullHeightTitle = !!(title && fullHeight);
  const hideTitleContainer = !commentToC ? fullHeightTitle : fullHeightTitle && isPinned;

  const offsetStyling = offset !== undefined ? { flex: offset } : undefined;

  useEffect(() => {
    if (rowRef.current) {
      // To prevent the comment ToC title from being hidden when scrolling up
      // This relies on the complementary `top: -1px` styling in `MultiToCLayout` on the parent sticky element
      const observer = new IntersectionObserver(([e]) => {
        const newIsPinned = e.intersectionRatio < 1;
        setIsPinned(newIsPinned);
      }, { threshold: [1] });
  
      observer.observe(rowRef.current);  
    }
  }, []);

  if (divider) {
    return <Components.TableOfContentsDivider offsetStyling={offsetStyling} />
  }
  
  return <div
    className={classNames(
      classes.root,
      levelToClassName(indentLevel, classes),
      { [classes.titleContainer]: fullHeightTitle, [TITLE_CONTAINER_CLASS_NAME]: hideTitleContainer },
      { [classes.highlighted]: highlighted },
    )}
    style={offsetStyling}
    ref={rowRef}
  >
    <a href={href} onClick={onClick} className={classNames(classes.link, {
      [classes.title]: title,
      [classes.highlightDot]: !answer,
      [classes.dense]: dense,
    })}>
      {children}
    </a>
  </div>
}

const TableOfContentsRowComponent = registerComponent("TableOfContentsRow", TableOfContentsRow, {styles});

declare global {
  interface ComponentTypes {
    TableOfContentsRow: typeof TableOfContentsRowComponent
  }
}
