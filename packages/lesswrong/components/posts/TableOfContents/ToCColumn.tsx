import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { MAX_COLUMN_WIDTH } from '../PostsPage/PostsPage';
import classNames from 'classnames';

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
        1.5fr
      `,
      gridTemplateAreas: `
        "... ... .... title   .... ..."
        "... toc gap1 content gap2 ..."
      `,
    },
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
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
  stickyBlock: {
    position: "sticky",
    fontSize: 12,
    top: 92,
    lineHeight: 1.0,
    marginLeft:1,
    paddingLeft:theme.spacing.unit*2,
    textAlign:"left",
    height:"80vh",
    overflowY:"scroll",
    "&::-webkit-scrollbar": {
      width: 1,
    },

    /* Track */
    "&::-webkit-scrollbar-track": {
        background: "none",
    },

    /* Handle */
    "&::-webkit-scrollbar-thumb": {
        background: theme.palette.grey[300],
    },

    /* Handle on hover */
    "&::-webkit-scrollbar-thumb:hover": {
        background: theme.palette.grey[700],
    },

    [theme.breakpoints.down('sm')]:{
      display:'none'
    }
  },
  content: { gridArea: 'content' },
  gap1: { gridArea: 'gap1'},
  gap2: { gridArea: 'gap2'},
});

export const ToCColumn = ({tableOfContents, header, children, classes}: {
  tableOfContents: React.ReactNode|null,
  header: React.ReactNode,
  children: React.ReactNode,
  classes: ClassesType
}) => {
  return (
    <div className={classNames(classes.root, {[classes.tocActivated]: !!tableOfContents})}>
      <div className={classes.header}>
        {header}
      </div>
      {tableOfContents && <div className={classes.toc}>
        <div className={classes.stickyBlock}>
          {tableOfContents}
        </div>
      </div>}
      <div className={classes.gap1}/>
      <div className={classes.content}>
        {children}
      </div>
      <div className={classes.gap2}/>
    </div>
  );
}

const ToCColumnComponent = registerComponent("ToCColumn", ToCColumn, {styles});

declare global {
  interface ComponentTypes {
    ToCColumn: typeof ToCColumnComponent
  }
}
