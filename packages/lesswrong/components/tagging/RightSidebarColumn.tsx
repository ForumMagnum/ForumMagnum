import React from 'react';
import { MAX_COLUMN_WIDTH } from '../posts/PostsPage/PostsPage';
import { TAB_NAVIGATION_MENU_WIDTH } from '../common/TabNavigationMenu/TabNavigationMenu';
import { registerComponent } from '../../lib/vulcan-lib';

const SIDEBAR_WIDTH = 250

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 12
    },
    [theme.breakpoints.down('md')]: {
      display: 'block !important',
    },
    // Check for support for template areas before applying
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateColumns: `
        1.5fr
        minmax(min-content, ${MAX_COLUMN_WIDTH}px)
        minmax(50px, 100px)
        ${SIDEBAR_WIDTH}px
        10px
        1fr
      `,
      gridTemplateAreas: `
        "... title   .... ....... .... ..."
        "gap1 content gap2 sidebar gap3 ..."
      `,
    },
  },
  header: {
    gridArea: 'title',
  },
  // These two "sticky" classes are for making the table of contents stick to the top of the screen,
  // we don't need this atm, but we might want to add it back in in future so I'm leaving them here
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
  gap1: {
    gridArea: 'gap1',
    minWidth: TAB_NAVIGATION_MENU_WIDTH + 80,
    [theme.breakpoints.down('md')]: {
      minWidth: 0,
    },
  },
  gap2: { gridArea: 'gap2'},
  sidebar: {
    gridArea: 'sidebar',
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  gap3: { gridArea: 'gap3' }
});

export const RightSidebarColumn = ({header, sidebar, children, classes}: {
  header: React.ReactNode,
  children: React.ReactNode,
  classes: ClassesType,
  sidebar?: React.ReactNode,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.header}>
        {header}
      </div>
      <div className={classes.gap1}/>
      <div className={classes.content}>
        {children}
      </div>
      <div className={classes.gap2}/>
      {sidebar && <div className={classes.sidebar}>
        {sidebar}
      </div>}
      <div className={classes.gap3}/>
    </div>
  );
}

const RightSidebarColumnComponent = registerComponent("RightSidebarColumn", RightSidebarColumn, {styles});

declare global {
  interface ComponentTypes {
    RightSidebarColumn: typeof RightSidebarColumnComponent
  }
}
