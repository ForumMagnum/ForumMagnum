import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { MAX_COLUMN_WIDTH } from '../PostsPage/PostsPage';
import { SidebarsContext } from '../../common/SidebarsWrapper';
import { useTracking } from '../../../lib/analyticsEvents';
import { isClient } from '../../../lib/executionEnvironment';
import classNames from 'classnames';
import { isFriendlyUI } from '../../../themes/forumTheme';

const DEFAULT_TOC_MARGIN = 100
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200
export const MAX_CONTENT_WIDTH = 720;
const TOC_OFFSET_TOP = 92
const TOC_OFFSET_BOTTOM = 64

export const styles = (theme: ThemeType) => ({
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
      1fr minmax(200px,270px) minmax(10px,25px) minmax(min-content,${MAX_CONTENT_WIDTH}px) minmax(10px, 25px) min-content 350px 1fr !important
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
    marginTop: -TOC_OFFSET_TOP,
    marginBottom: -TOC_OFFSET_BOTTOM,

    [theme.breakpoints.down('sm')]:{
      display: "none",
      marginTop: 0,
      marginBottom: 0,
    },
  },
  stickyBlockScroller: {
    position: "sticky",
    fontSize: 12,
    top: 0,
    lineHeight: 1.0,
    marginLeft: 1,
    paddingLeft: theme.spacing.unit*2,
    textAlign: "left",
    maxHeight: "100vh",
    overflowY: "auto",
    
    scrollbarWidth: "none", //Firefox-specific
    "&::-webkit-scrollbar": { //Everything-else
      width: 0,
    },

    [theme.breakpoints.down('sm')]:{
      display:'none'
    }
  },
  stickyBlock: {
    // Cancels the direction:rtl in stickyBlockScroller
    direction: "ltr",
    
    paddingTop: TOC_OFFSET_TOP,
    paddingBottom: TOC_OFFSET_BOTTOM,
  },
  content: { gridArea: 'content' },
  gap1: { gridArea: 'gap1'},
  gap2: { gridArea: 'gap2'},
  gap3: { gridArea: 'gap3' },
  rhs: {
    gridArea: 'rhs',
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
    zIndex: theme.zIndexes.hideTableOfContentsButton,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  hideTocButtonHidden: {
    display: "none",
  },
});

const shouldHideToggleContentsButton = () => {
  if (!isClient) {
    return false;
  }

  const {scrollY, innerHeight} = window;
  const scrollEnd = document.body.scrollHeight - innerHeight;
  // We hide the button when:
  //  - scrolled to 0 to prevent showing the button above the page header when
  //    scrolling up quickly
  //  - scrolled all the way to the end of the page to prevent the button
  //    colliding with the table of contents
  return scrollY > 0 && scrollY < scrollEnd * 0.99;
}

export const ToCColumn = ({
  tableOfContents,
  header,
  rightColumnChildren,
  notHideable,
  children,
  classes,
}: {
  tableOfContents: React.ReactNode|null,
  header?: React.ReactNode,
  rightColumnChildren?: React.ReactNode,
  notHideable?: boolean,
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const {sideCommentsActive} = useContext(SidebarsContext)!;
  const [hideTocButtonHidden, setHideTocButtonHidden] = useState(
    shouldHideToggleContentsButton,
  );
  const [hidden, setHidden] = useState(false);
  const hideable = isFriendlyUI && !notHideable && !!tableOfContents;

  useEffect(() => {
    const handler = () => setHideTocButtonHidden(
      shouldHideToggleContentsButton(),
    );
    window.addEventListener("scroll", handler);
    () => window.removeEventListener("scroll", handler);
  });

  const toggleHideContents = useCallback(() => {
    setHidden(!hidden);
    captureEvent("toggleHideContents", {hidden: !hidden});
  }, [hidden, captureEvent]);

  return (
    <div className={classNames(
      classes.root,
      {
        [classes.tocActivated]: !!tableOfContents || !!rightColumnChildren,
        [classes.sideCommentsActive]: sideCommentsActive,
      }
    )}>
      {hideable &&
        <div
          onClick={toggleHideContents}
          className={classNames(classes.hideTocButton, {
            [classes.hideTocButtonHidden]: !hideTocButtonHidden,
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
      <div className={classes.gap2}/>
      {rightColumnChildren &&
        <div className={classes.rhs}>
          {rightColumnChildren}
        </div>
      }
      <div className={classes.gap3}/>
    </div>
  );
}

const ToCColumnComponent = registerComponent("ToCColumn", ToCColumn, {styles});

declare global {
  interface ComponentTypes {
    ToCColumn: typeof ToCColumnComponent
  }
}
