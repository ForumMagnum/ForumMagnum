import React from 'react';
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { TAB_NAVIGATION_MENU_WIDTH } from '../../common/TabNavigationMenu/TabNavigationMenu';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { makeCloudinaryImageUrl } from '../../common/CloudinaryImage2';

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
    marginTop: -50,
    // TODO comment
    overflow: 'hidden',
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
  bannerImage: {
    position: 'absolute',
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
  titleComponent: {
    gridArea: 'title',
    zIndex: 10, // display over image
  },
  content: {
    gridArea: 'content',
    marginTop: 24,
    [theme.breakpoints.down('sm')]: {
      padding: '0 8px',
    }
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
export const RightSidebarColumn = ({titleComponent, bannerImageId, headerComponent, sidebarComponents = [], children, classes}: {
  titleComponent: React.ReactNode,
  bannerImageId: string,
  headerComponent: React.ReactNode,
  children: React.ReactNode,
  classes: ClassesType,
  sidebarComponents?: React.ReactNode[],
}) => {
  const nonEmptySidebarComponents = sidebarComponents.filter(x => x) // filter out nulls to avoid extra spacing
  const { CloudinaryImage2 } = Components

  // TODO: support having no image (even if just for admins to set up the page)
  // const bannerImageUrl = makeCloudinaryImageUrl(bannerImageId, {c: 'fill', dpr: 'auto', q: 'auto', f: 'auto', g: 'auto:faces', h: '600', w: 'iw'})
  
  return (
    <>
      <div className={classes.titleWrapper}>
        <CloudinaryImage2
          className={classes.bannerImage}
          publicId={bannerImageId}
          height={228} // FIXME explicitly set shared height
          fullWidthHeader
        />
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
