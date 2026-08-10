import React, { useContext } from 'react';
import { MAX_COLUMN_WIDTH } from '../PostsPage/constants';
import { SidebarsContext } from '@/components/layout/SidebarsWrapper';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const DEFAULT_TOC_MARGIN = 100
const MAX_TOC_WIDTH = 270
const MIN_TOC_WIDTH = 200
export const MAX_CONTENT_WIDTH = 720;
const TOC_OFFSET_TOP = 92
const TOC_OFFSET_BOTTOM = 64

export const styles = defineStyles("ToCColumn", (theme: ThemeType) => ({
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
    paddingLeft: 16,
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
}));

export const ToCColumn = ({
  tableOfContents,
  header,
  rightColumnChildren,
  children,
}: {
  tableOfContents: React.ReactNode|null,
  header?: React.ReactNode,
  rightColumnChildren?: React.ReactNode,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const {sideCommentsActive} = useContext(SidebarsContext)!;

  return (
    <div className={classNames(
      classes.root,
      {
        [classes.tocActivated]: !!tableOfContents || !!rightColumnChildren,
        [classes.sideCommentsActive]: sideCommentsActive,
      }
    )}>
      <div className={classes.header}>
        {header}
      </div>
      {tableOfContents && <div className={classes.toc}>
        <div className={classes.stickyBlockScroller}>
          <div className={classes.stickyBlock}>
            {tableOfContents}
          </div>
        </div>
      </div>}
      <div className={classes.gap1}/>
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

export default ToCColumn;


