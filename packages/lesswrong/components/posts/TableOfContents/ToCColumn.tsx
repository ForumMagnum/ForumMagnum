import React, { useContext, useEffect, useState } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { MAX_COLUMN_WIDTH } from '../PostsPage/PostsPage';
import { SidebarsContext } from '../../common/SidebarsWrapper';
import classNames from 'classnames';
import { isEAForum } from '../../../lib/instanceSettings';

const DEFAULT_TOC_MARGIN = 100
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 12
    }
  },
  header: {
    gridArea: 'title',
  },
  tocActivated: {
    // Check for support for template areas before applying
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateColumns: `
        1fr
        minmax(${MIN_TOC_WIDTH}px, ${MAX_TOC_WIDTH}px)
        minmax(0px, ${DEFAULT_TOC_MARGIN}px)
        minmax(min-content, ${MAX_COLUMN_WIDTH}px)
        minmax(0px, ${DEFAULT_TOC_MARGIN}px)
        min-content
        10px
        1.5fr
      `,
      gridTemplateAreas: `
        "... ... .... title   .... ... .... ..."
        "... toc gap1 content gap2 rhs gap3 ..."
      `,
    },
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  sideCommentsActive: {
    gridTemplateColumns: `
      1fr minmax(200px,270px) minmax(10px,25px) minmax(min-content,720px) minmax(10px, 25px) min-content 350px 1fr !important
    `
  },
  toc: {
    '@supports (grid-template-areas: "title")': {
      gridArea: 'toc',
      position: 'unset',
      width: 'unset'
    },
    //Fallback styles in case we don't have CSS-Grid support. These don't get applied if we have a grid
    position: 'absolute',
    width: MAX_TOC_WIDTH,
    left: -DEFAULT_TOC_MARGIN,
  },
  stickyBlockScroller: {
    position: "sticky",
    fontSize: 12,
    top: 92,
    lineHeight: 1.0,
    marginLeft: 1,
    paddingLeft: theme.spacing.unit*2,
    textAlign: "left",
    height: "80vh",
    overflowY: "auto",

    // Moves the scrollbar to the left side. Cancelled out by a matching
    // direction:ltr on the next div in.
    direction: "rtl",

    // Nonstandard WebKit-specific scrollbar styling.
    "&::-webkit-scrollbar": {
      width: 1,
    },
    // Track
    "&::-webkit-scrollbar-track": {
      background: "none",
    },

    // Handle
    "&::-webkit-scrollbar-thumb": {
      background: theme.palette.grey[300],
      "&:hover": {
        background: theme.palette.grey[700],
      },
    },

    // Pre-standard Firefox-specific scrollbar styling. See
    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scrollbars.
    scrollbarWidth: "thin",
    scrollbarColor: theme.palette.tocScrollbarColors,

    [theme.breakpoints.down('sm')]:{
      display:'none'
    }
  },
  stickyBlock: {
    // Cancels the direction:rtl in stickyBlockScroller
    direction: "ltr",
  },
  content: { gridArea: 'content' },
  gap1: { gridArea: 'gap1'},
  gap2: { gridArea: 'gap2'},
  gap3: { gridArea: 'gap3' },
  rhs: {
    gridArea: 'rhs',
  },
  rhsHideMediumDown: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  hideTocButton: {
    position: "fixed",
    top: 0,
    left: 0,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[600],
    margin: 18,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    userSelect: "none",
    cursor: "pointer",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  hideTocButtonHidden: {
    display: "none",
  },
});

export const ToCColumn = ({
  tableOfContents,
  header,
  welcomeBox,
  rhsRecommendations,
  children,
  classes,
}: {
  tableOfContents: React.ReactNode|null,
  header?: React.ReactNode,
  welcomeBox?: React.ReactNode,
  rhsRecommendations?: React.ReactNode,
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  const {sideCommentsActive} = useContext(SidebarsContext)!;
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const hideable = isEAForum;

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handler);
    () => window.removeEventListener("scroll", handler);
  });

  return (
    <div className={classNames(
      classes.root,
      {
        [classes.tocActivated]: !!tableOfContents || !!welcomeBox || !!rhsRecommendations,
        [classes.sideCommentsActive]: sideCommentsActive,
      }
    )}>
      {hideable &&
        <div
          onClick={() => setHidden(!hidden)}
          className={classNames(classes.hideTocButton, {
            [classes.hideTocButtonHidden]: !isScrolled,
          })}
        >
          <Components.ForumIcon icon="ListBullet" />
          {hidden ? "Show" : "Hide"} table of contents
        </div>
      }
      <div className={classes.header}>
        {header}
      </div>
      {!hidden &&
        <>
          {tableOfContents && <div className={classes.toc}>
            <div className={classes.stickyBlockScroller}>
              <div className={classes.stickyBlock}>
                {tableOfContents}
              </div>
            </div>
          </div>}
          <div className={classes.gap1}/>
        </>
      }
      <div className={classes.content}>
        {children}
      </div>
      {!hidden &&
        <>
          <div className={classes.gap2}/>
          {welcomeBox || rhsRecommendations &&
            <div className={classNames(classes.rhs, {
              [classes.rhsHideMediumDown]: welcomeBox,
            })}>
              {welcomeBox}
              {rhsRecommendations}
            </div>
          }
          <div className={classes.gap3}/>
        </>
      }
    </div>
  );
}

const ToCColumnComponent = registerComponent("ToCColumn", ToCColumn, {styles});

declare global {
  interface ComponentTypes {
    ToCColumn: typeof ToCColumnComponent
  }
}
