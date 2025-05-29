import React, { useEffect, useRef, useState } from 'react';
import { MAX_COLUMN_WIDTH } from '@/components/posts/PostsPage/constants';
import { TAB_NAVIGATION_MENU_WIDTH } from '../../common/TabNavigationMenu/TabNavigationMenu';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import CloudinaryImage2 from "../../common/CloudinaryImage2";

const MIN_SIDEBAR_WIDTH = 250
const MAX_SIDEBAR_WIDTH = 370
const MIN_GAP = 20

const TITLE_HEIGHT_DESKTOP = 245 // ~exactly right
const TITLE_HEIGHT_MOBILE = 210 // slightly oversized to account for possible wrapping

const Z_TOP = 3
const Z_IMAGE = 1
const Z_OVERLAY = 2

const gridTemplateColumns = `
  minmax(${TAB_NAVIGATION_MENU_WIDTH + MIN_GAP}px, ${TAB_NAVIGATION_MENU_WIDTH + 250}px)
  0.7fr
  minmax(${MAX_COLUMN_WIDTH - 20}px, ${MAX_COLUMN_WIDTH}px)
  minmax(${MIN_GAP}px, 70px)
  minmax(${MIN_SIDEBAR_WIDTH}px, ${MAX_SIDEBAR_WIDTH}px)
  minmax(${MIN_GAP}px, 50px)
  1fr
`

export const styles = (theme: ThemeType) => ({
  titleWrapper: {
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
  bannerImageWrapper: {
    position: 'absolute',
    width: '100%',
    zIndex: Z_IMAGE,
  },
  bannerImage: {
    width: '100%',
    objectFit: 'cover',
    height: TITLE_HEIGHT_DESKTOP,
    [theme.breakpoints.down('sm')]: {
      height: TITLE_HEIGHT_MOBILE,
    }
  },
  translucentOverlay: {
    position: 'absolute',
    zIndex: Z_OVERLAY,
    width: '100%',
    height: TITLE_HEIGHT_DESKTOP,
    backgroundColor: theme.palette.background.imageOverlay, // hardcode overlay to keep it the same in light and dark mode
    [theme.breakpoints.down('sm')]: {
      height: TITLE_HEIGHT_MOBILE,
    }
  },
  header: {
    position: 'relative',
    background: theme.palette.panelBackground.default,
    zIndex: Z_TOP,
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
  titleComponent: {
    position: 'relative',
    gridArea: 'title',
    zIndex: Z_TOP, // display over image
    maxHeight: TITLE_HEIGHT_DESKTOP,
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

export const SubforumLayout = ({titleComponent, bannerImageId, headerComponent, sidebarComponents = [], children, classes}: {
  titleComponent: React.ReactNode,
  bannerImageId: string,
  headerComponent: React.ReactNode,
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  sidebarComponents?: React.ReactNode[],
}) => {
  const nonEmptySidebarComponents = sidebarComponents.filter(x => x) // filter out nulls to avoid extra spacing
  /*
   * The logic for rendering the banner image has turned out more complicated than I would
   * have liked, but unfortunately it is neccesary to achieve the following things:
   * 1. Cropping the image nicely
   * 2. Not having any noticeable layout shift (on mobile)
   *
   * Explanation:
   * 1. We want the title div to be the exact same height as the background image, the best
   *    way to do this would be to set the image in CSS as the `background-image` of the title div.
   *    Unfortunately there is a lot of magic in CloudinaryImage2 which makes the cropping look
   *    nice, I couldn't reproduce this with the `background-image` method so I have ended up
   *    setting the title div as `position: relative` and the background image (and translucent overlay)
   *    as `position: absolute` to make them display on top of each other
   * 2. The downside of doing the `position: relative`/`position: absolute` trick is that there is
   *    no way for the two divs to know each others height from pure CSS. Additionally, the cropping
   *    in CloudinaryImage2 relies on knowing the height in code, so it's ~necessary to set the height
   *    in code.
   *    This can't be done until after the page has rendered once, which would cause a layout
   *    shift. To fix this I have made it so the banner image starts off slightly oversized but is hidden
   *    behind the next element by using z-indices. Once the page has rendered once, the height gets
   *    updated to exactly the right value which fixes the cropping (this is fairly discreet)
   */
  const titleComponentRef = useRef<HTMLDivElement>(null);
  const translucentOverlayRef = useRef<HTMLDivElement>(null);
  const [bannerHeight, setBannerHeight] = useState<number | undefined>(undefined);
  
  const updateElementsHeight = () => {
    if (
      titleComponentRef.current &&
      translucentOverlayRef.current
    ) {
      const titleHeight = titleComponentRef.current.offsetHeight;
      translucentOverlayRef.current.style.height = `${titleHeight}px`;
      setBannerHeight(titleHeight);
    }
  };

  useEffect(() => {
    updateElementsHeight();
    window.addEventListener('resize', updateElementsHeight);
  
    return () => {
      window.removeEventListener('resize', updateElementsHeight);
    };
  }, []);
  
  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.bannerImageWrapper}>
          <CloudinaryImage2
            className={classes.bannerImage}
            publicId={bannerImageId}
            height={bannerHeight}
            fullWidthHeader
          />
        </div>
        <div className={classes.translucentOverlay} ref={translucentOverlayRef}></div>
        <div className={classes.titleComponent} ref={titleComponentRef}>{titleComponent}</div>
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

export default registerComponent("SubforumLayout", SubforumLayout, {styles});


