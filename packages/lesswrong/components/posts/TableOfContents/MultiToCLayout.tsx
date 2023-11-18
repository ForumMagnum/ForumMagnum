import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { MAX_COLUMN_WIDTH } from '../PostsPage/PostsPage';

const DEFAULT_TOC_MARGIN = 100
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200
export const MAX_CONTENT_WIDTH = 720;
const TOC_OFFSET_TOP = 92
const TOC_OFFSET_BOTTOM = 64

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    display: "grid",
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
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      paddingTop: 12
    },
  },
  toc: {
    position: 'unset',
    width: 'unset',
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
  content: {},
  gap1: { gridArea: 'gap1'},
  gap2: { gridArea: 'gap2'},
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
})

export type ToCLayoutSegment = {
  toc?: React.ReactNode,
  centralColumn: React.ReactNode,
  rightColumn?: React.ReactNode,
};

const MultiToCLayout = ({segments, classes}: {
  segments: ToCLayoutSegment[],
  classes: ClassesType,
}) => {
  const tocVisible = true;
  const gridTemplateAreas = segments
    .map((_segment,i) => `"... toc${i} gap1 content${i} gap2 rhs${i} gap3 ..."`)
    .join('\n')
  return <div className={classNames(classes.root)} style={{ gridTemplateAreas }}>
    {segments.map((segment,i) => <React.Fragment key={i}>
      {segment.toc && tocVisible && <>
        <div className={classes.toc} style={{ "gridArea": `toc${i}` }} >
          <div className={classes.stickyBlockScroller}>
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

