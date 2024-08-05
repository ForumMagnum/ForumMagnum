import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { MAX_COLUMN_WIDTH } from '../PostsPage/PostsPage';
import { fullHeightToCEnabled } from '../../../lib/betas';

export const MAX_CONTENT_WIDTH = 720;
const TOC_OFFSET_TOP = 92
const TOC_OFFSET_BOTTOM = 64

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "grid",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 12,
    },
  },
  withFullHeightToCColumns: {
    gridTemplateColumns: `
      0px
      minmax(200px, 270px)
      minmax(35px, 0.5fr)
      minmax(min-content, ${MAX_COLUMN_WIDTH}px)
      minmax(10px,30px)
      min-content
      minmax(0px, 0.5fr)
    `,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: `
        0px
        0px
        1fr
        minmax(0,${MAX_COLUMN_WIDTH}px)
        minmax(5px,1fr)
        min-content
        0px
      `
    },
  },
  withoutFullHeightToCColumns: {
    gridTemplateColumns: `
      1fr
      minmax(200px, 270px)
      minmax(0px, 1fr)
      minmax(min-content, ${MAX_COLUMN_WIDTH}px)
      10px
      min-content
      minmax(1.5frpx, 3fr)
    `,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns:
        // lm   toc  gap1  content  gap2  rhs          rm
           "5px 0px  0px   1fr      10px  min-content  5px",
    },
  },
  toc: {
    position: 'unset',
    width: 'unset',
    marginTop: fullHeightToCEnabled ? -50 : -TOC_OFFSET_TOP,
    marginBottom: fullHeightToCEnabled ? undefined : -TOC_OFFSET_BOTTOM,

    [theme.breakpoints.down('sm')]:{
      display: "none",
      marginTop: 0,
      marginBottom: 0,
    },
  },
  splashPageHeaderToc: {
    marginTop: 'calc(-100vh - 64px)'
  },
  normalHeaderToc: {
    
  },
  commentToCMargin: {
    marginTop: 'unset',
  },
  // This is needed for an annoying IntersectionObserver hack to prevent the title from being hidden when scrolling up
  commentToCIntersection: {
    // And unfortunately we need !important because otherwise this style gets overriden by the `top: 0` in `stickyBlockScroller`
    top: '-1px !important'
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
    height: fullHeightToCEnabled ? "100%" : undefined,
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
    height: fullHeightToCEnabled ? "100%" : undefined,
    paddingTop: fullHeightToCEnabled ? undefined : TOC_OFFSET_TOP,
    paddingBottom: fullHeightToCEnabled ? undefined : TOC_OFFSET_BOTTOM,
  },
  content: {},
  rhs: {},
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

export type ToCLayoutSegment = {
  toc?: React.ReactNode,
  centralColumn: React.ReactNode,
  rightColumn?: React.ReactNode,
  isCommentToC?: boolean,
};

const MultiToCLayout = ({segments, classes, tocRowMap = [], showSplashPageHeader = false}: {
  segments: ToCLayoutSegment[],
  classes: ClassesType<typeof styles>,
  tocRowMap?: number[], // This allows you to specify which row each ToC should be in, where maybe you want a ToC to span more than one row
  showSplashPageHeader?: boolean,
}) => {
  const tocVisible = true;
  const gridTemplateAreas = segments
    .map((_segment,i) => `". toc${tocRowMap[i] || i} gap1 content${i} gap2 rhs${i} ."`)
    .join('\n')
  return <div
    className={classNames(
      classes.root,
      fullHeightToCEnabled && classes.withFullHeightToCColumns,
      !fullHeightToCEnabled && classes.withoutFullHeightToCColumns,
    )}
    style={{ gridTemplateAreas }}
  >
    {segments.map((segment,i) => <React.Fragment key={i}>
      {segment.toc && tocVisible && <>
        <div
          style={{ "gridArea": `toc${i}` }}
          className={classNames(
            classes.toc,
            segment.isCommentToC && classes.commentToCMargin,
            showSplashPageHeader && classes.splashPageHeaderToc,
            !showSplashPageHeader && classes.normalHeaderToc,
          )}
        >
          <div className={classNames(
            classes.stickyBlockScroller,
            segment.isCommentToC && classes.commentToCIntersection
          )}>
            <div className={classes.stickyBlock}>
              {segment.toc}
            </div>
          </div>
        </div>
      </>}
      <div
        className={classes.content}
        style={{ "gridArea": `content${i}` }}
      >
        {segment.centralColumn}
      </div>
      {segment.rightColumn && <div
        className={classes.rhs}
        style={{ "gridArea": `rhs${i}` }}
      >
        {segment.rightColumn}
      </div>}
    </React.Fragment>)}
  </div>
}

const MultiToCLayoutComponent = registerComponent('MultiToCLayout', MultiToCLayout, {styles});

declare global {
  interface ComponentTypes {
    MultiToCLayout: typeof MultiToCLayoutComponent
  }
}

