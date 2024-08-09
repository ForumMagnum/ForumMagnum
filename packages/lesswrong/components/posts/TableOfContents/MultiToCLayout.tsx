import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { MAX_COLUMN_WIDTH } from '../PostsPage/PostsPage';
import { fullHeightToCEnabled } from '../../../lib/betas';

const FULL_HEIGHT_TOC_LEFT_MARGIN = '1fr'
const DEFAULT_TOC_MARGIN = '1.5fr'
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200
export const MAX_CONTENT_WIDTH = 720;
const TOC_OFFSET_TOP = 92
const TOC_OFFSET_BOTTOM = 64
const LEFT_COLUMN_WIDTH = fullHeightToCEnabled ? '0fr' : '1fr';
const RIGHT_COLUMN_WIDTH = fullHeightToCEnabled ? '0fr' : '1.5fr';

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: `
      ${LEFT_COLUMN_WIDTH}
      minmax(${MIN_TOC_WIDTH}px, ${MAX_TOC_WIDTH}px)
      minmax(50px, ${FULL_HEIGHT_TOC_LEFT_MARGIN})
      minmax(min-content, ${MAX_COLUMN_WIDTH}px)
      minmax(300px, ${DEFAULT_TOC_MARGIN})
      minmax(min-content, 300px)
      10px
      ${RIGHT_COLUMN_WIDTH}
    `,
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      paddingTop: 12
    },
  },
  toc: {
    position: 'unset',
    width: 'unset',
    left: -DEFAULT_TOC_MARGIN,
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
  gap1: { gridArea: 'gap1' },
  gap2: { gridArea: 'gap2' },
  gap3: { gridArea: 'gap3' },
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
  const [leftHover, setLeftHover] = React.useState(false);
  const tocVisible = true;
  const gridTemplateAreas = segments
    .map((_segment,i) => `"... toc${tocRowMap[i] || i} gap1 content${i} gap2 rhs${i} gap3 ..."`)
    .join('\n')
  return <div className={classNames(classes.root)} style={{ gridTemplateAreas }}>
    {segments.map((segment,i) => <React.Fragment key={i}>
      {segment.toc && tocVisible && <>
        <div className={classNames(classes.toc, { [classes.commentToCMargin]: segment.isCommentToC, [classes.splashPageHeaderToc]: showSplashPageHeader, [classes.normalHeaderToc]: !showSplashPageHeader })} 
          style={{ "gridArea": `toc${i}` }} 
          onMouseEnter={() => setLeftHover(true)} 
          onMouseLeave={() => setLeftHover(false)}
        >
          <div className={classNames(classes.stickyBlockScroller, { [classes.commentToCIntersection]: segment.isCommentToC })}>
            <div className={classes.stickyBlock}>
              {/* This allows the ToC to appear when the user hovers over either of the two left-columns */}
              {React.cloneElement(segment.toc as React.ReactElement, { hover: leftHover })}
            </div>
          </div>
        </div>
      </>}
      <div className={classes.gap1} onMouseEnter={() => setLeftHover(true)} onMouseLeave={() => setLeftHover(false)}/>
      <div className={classes.content} style={{ "gridArea": `content${i}` }} >
        {segment.centralColumn}
      </div>
      <div className={classes.gap2}/>
      {segment.rightColumn && <div className={classes.rhs} style={{ "gridArea": `rhs${i}` }}>
        {segment.rightColumn}
      </div>}
      <div className={classes.gap3}/>
    </React.Fragment>)}
  </div>
}

const MultiToCLayoutComponent = registerComponent('MultiToCLayout', MultiToCLayout, {styles});

declare global {
  interface ComponentTypes {
    MultiToCLayout: typeof MultiToCLayoutComponent
  }
}

