import React from 'react';
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { TAB_NAVIGATION_MENU_WIDTH } from '../../common/TabNavigationMenu/TabNavigationMenu';
import { registerComponent } from '../../../lib/vulcan-lib';
import classNames from 'classnames';

const MIN_SIDEBAR_WIDTH = 250
const MAX_SIDEBAR_WIDTH = 370
const MIN_GAP = 20

// TODO rename entire file

const gridTemplateColumns = `
  minmax(${TAB_NAVIGATION_MENU_WIDTH + MIN_GAP}px, ${TAB_NAVIGATION_MENU_WIDTH + 250}px)
  0.7fr
  minmax(${MAX_COLUMN_WIDTH - 20}px, ${MAX_COLUMN_WIDTH}px)
  minmax(${MIN_GAP}px, 70px)
  minmax(${MIN_SIDEBAR_WIDTH}px, ${MAX_SIDEBAR_WIDTH}px)
  minmax(${MIN_GAP}px, 50px)
  1fr
`

export const styles = (theme: ThemeType): JssStyles => ({
  titleWrapper: {
    [theme.breakpoints.down('md')]: {
      display: 'block !important',
    },
    // Check for support for template areas before applying
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateColumns: gridTemplateColumns,
      gridTemplateAreas: `
        "... ... title   .... ....... .... ..."
      `,
    },
  },
  header: {
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down('md')]: {
      display: 'block !important',
    },
    // Check for support for template areas before applying
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateColumns: gridTemplateColumns,
      gridTemplateAreas: `
        "... ... header   .... ....... .... ..."
      `,
    },
  },
  body: {
    [theme.breakpoints.down('md')]: {
      display: 'block !important',
    },
    // Check for support for template areas before applying
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateColumns: gridTemplateColumns,
      gridTemplateAreas: `
        "... ... content gap1 sidebar gap2 ..."
      `,
    },
  },
  headerInner: {
    gridArea: 'header',
  },
  titleImage: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // TODO pass in image
    backgroundImage: `url(https://res.cloudinary.com/cea/image/upload/c_crop,g_custom/c_fill,dpr_auto,q_auto,f_auto,g_auto:faces,h_600,w_iw/Banner/s36j3n2gvmpzvcbmxixi)`,
    marginTop: -50,
  },
  titleComponent: {
    gridArea: 'title',
    zIndex: 10, // display over image
  },
  content: {
    gridArea: 'content',
    marginTop: 24,
  },
  gap1: { gridArea: 'gap1'},
  sidebar: {
    gridArea: 'sidebar',
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  gap2: { gridArea: 'gap2' }
});

// TODO rename this component to CoreTopicLayout or something
export const RightSidebarColumn = ({titleComponent, headerComponent, sidebarComponents = [], children, classes}: {
  titleComponent: React.ReactNode,
  headerComponent: React.ReactNode,
  children: React.ReactNode,
  classes: ClassesType,
  sidebarComponents?: React.ReactNode[],
}) => {
  const nonEmptySidebarComponents = sidebarComponents.filter(x => x) // filter out nulls to avoid extra spacing
  
  return (
    <>
      {/* TODO put header image as background on this div */}
      <div className={classNames(classes.titleWrapper, classes.titleImage)}>
        <div className={classes.titleComponent}>{titleComponent}</div>
      </div>
      <div className={classes.header}>
        <div className={classes.headerInner}>{headerComponent}</div>
      </div>
      <div className={classes.body}>
        {/* padding div to stop page overlapping with nav sidebar */}
        <div />
        <div className={classes.content}>{children}</div>
        <div className={classes.gap1} />
        {nonEmptySidebarComponents.length ? <div className={classes.sidebar}>{nonEmptySidebarComponents}</div> : <></>}
        <div className={classes.gap2} />
      </div>
    </>
  );
}

const RightSidebarColumnComponent = registerComponent("RightSidebarColumn", RightSidebarColumn, {styles});

declare global {
  interface ComponentTypes {
    RightSidebarColumn: typeof RightSidebarColumnComponent
  }
}
