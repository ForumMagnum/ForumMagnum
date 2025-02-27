import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { MAX_COLUMN_WIDTH } from '../PostsPage/PostsPage';
import { fullHeightToCEnabled } from '../../../lib/betas';
import { HEADER_HEIGHT } from '@/components/common/Header';

export const MAX_CONTENT_WIDTH = 720;
const TOC_OFFSET_TOP = 92
const TOC_OFFSET_BOTTOM = 64

export const HOVER_CLASSNAME = 'ToCRowHover'
export const DEFAULT_FIXED_TOC_COMMENT_COUNT_HEIGHT = 50;

const STICKY_BLOCK_SCROLLER_CLASS_NAME = 'MultiToCLayoutStickyBlockScroller';

const styles = (theme: ThemeType) => ({
  root: {
    [`&:has($gap1:hover) .${HOVER_CLASSNAME}, &:has($toc:hover) .${HOVER_CLASSNAME}, &:has($commentCount:hover) .${HOVER_CLASSNAME}`]: {
      opacity: 1
    },
  },
  tableOfContents: {
    position: "relative",
    display: "grid",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 12,
    },
    
    gridTemplateColumns: `
      0px
      minmax(200px, 270px)
      minmax(35px, 0.5fr)
      minmax(min-content, ${MAX_COLUMN_WIDTH}px)
      minmax(10px,30px)
      50px
      minmax(0px, 0.5fr)
    `,
    [theme.breakpoints.up('lg')]: {
      gridTemplateColumns: `
        0px
        minmax(200px, 270px)
        minmax(35px, 0.5fr)
        minmax(min-content, ${MAX_COLUMN_WIDTH}px)
        minmax(10px,30px)
        min-content
        minmax(0px, 0.5fr)
      `,
    },
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
  gap1: {gridArea: "gap1"},
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
  '@global': {
    // Hard-coding this class name as a workaround for one of the JSS plugins being incapable of parsing a self-reference ($titleContainer) while inside @global
    [`body:has(.headroom--pinned) .${STICKY_BLOCK_SCROLLER_CLASS_NAME}, body:has(.headroom--unfixed) .${STICKY_BLOCK_SCROLLER_CLASS_NAME}`]: {
      top: HEADER_HEIGHT,
      height: `calc(100vh - ${HEADER_HEIGHT}px - var(--fixed-toc-comment-count-height, ${DEFAULT_FIXED_TOC_COMMENT_COUNT_HEIGHT}px))`
    }
  },
  stickyBlockScroller: {
    position: "sticky",
    fontSize: 12,
    top: 0,
    transition: 'top 0.2s ease-in-out, height 0.2s ease-in-out',
    lineHeight: 1.0,
    marginLeft: 1,
    paddingLeft: theme.spacing.unit*2,
    textAlign: "left",
    maxHeight: `calc(100vh - var(--fixed-toc-comment-count-height, ${DEFAULT_FIXED_TOC_COMMENT_COUNT_HEIGHT}px))`,
    height: fullHeightToCEnabled ? `calc(100vh - var(--fixed-toc-comment-count-height, ${DEFAULT_FIXED_TOC_COMMENT_COUNT_HEIGHT}px))` : undefined,
    overflowY: "auto",
    
    scrollbarWidth: "none", //Firefox-specific
    "&::-webkit-scrollbar": { //Everything-else
      width: 0,
    },

    [theme.breakpoints.down('sm')]:{
      display:'none'
    },
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
  commentCount: {
    position: 'fixed',
    paddingLeft: 12,
    paddingTop: 12,
    paddingBottom: 20,
    height: `var(--fixed-toc-comment-count-height, ${DEFAULT_FIXED_TOC_COMMENT_COUNT_HEIGHT}px)`,
    bottom: 0,
    left: 0,
    width: 240,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    zIndex: 1000,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  }
});

export type ToCLayoutSegment = {
  toc?: React.ReactNode,
  centralColumn: React.ReactNode,
  rightColumn?: React.ReactNode,
  isCommentToC?: boolean,
};

const MultiToCLayout = ({segments, classes, tocRowMap = [], showSplashPageHeader = false, answerCount, commentCount, tocContext}: {
  segments: ToCLayoutSegment[],
  classes: ClassesType<typeof styles>,
  tocRowMap?: number[], // This allows you to specify which row each ToC should be in, where maybe you want a ToC to span more than one row
  showSplashPageHeader?: boolean,
  answerCount?: number,
  commentCount?: number,
  tocContext?: 'tag' | 'post'
}) => {
  const { LWCommentCount } = Components;
  const tocVisible = true;
  const gridTemplateAreas = segments
    .map((_segment,i) => `"... toc${tocRowMap[i] ?? i} gap1 content${i} gap2 rhs${i} ..."`)
    .join('\n');

  const gridTemplateRows = segments
    .map((_segment,i) => (i + 1) >= segments.length ? '1fr' : 'min-content')
    .join(' ');

  const showCommentCount = commentCount !== undefined || answerCount !== undefined;

  // Create a ref for the root element to set CSS variable
  const rootRef = useRef<HTMLDivElement>(null);

  // Set the CSS variable when the component mounts
  useEffect(() => {
    if (rootRef.current) {
      const fixedTocCommentCountHeight = tocContext === 'tag' ? 20 : DEFAULT_FIXED_TOC_COMMENT_COUNT_HEIGHT;
      rootRef.current.style.setProperty('--fixed-toc-comment-count-height', `${fixedTocCommentCountHeight}px`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={classes.root} ref={rootRef}>
    <div className={classNames(classes.tableOfContents)} style={{ gridTemplateAreas, gridTemplateRows }}>
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
              STICKY_BLOCK_SCROLLER_CLASS_NAME,
              segment.isCommentToC && classes.commentToCIntersection
            )}>
              <div className={classes.stickyBlock}>
                {segment.toc}
              </div>
            </div>
          </div>
        </>}
        <div className={classes.gap1}/>
        <div className={classes.content} style={{ "gridArea": `content${i}` }} >
          {segment.centralColumn}
        </div>
        {segment.rightColumn && <div className={classes.rhs} style={{ "gridArea": `rhs${i}` }}>
          {segment.rightColumn}
        </div>}
      </React.Fragment>)}
    </div>
    {showCommentCount && <div className={classes.commentCount}>
      <LWCommentCount
        answerCount={answerCount}
        commentCount={commentCount}
      />
    </div>}
  </div>
}

const MultiToCLayoutComponent = registerComponent('MultiToCLayout', MultiToCLayout, {styles});

declare global {
  interface ComponentTypes {
    MultiToCLayout: typeof MultiToCLayoutComponent
  }
}

