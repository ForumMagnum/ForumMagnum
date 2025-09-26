"use client";
import CloudinaryImage2 from '@/components/common/CloudinaryImage2';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import React, { useEffect, useState } from 'react';
import { petrovDaySections } from './petrovDaySectionsFinal';
import ContentStyles from '@/components/common/ContentStyles';
import classNames from 'classnames';
import { useWindowSize } from '@/components/hooks/useScreenWidth';
import { getOffsetChainTop } from '@/lib/utils/domUtil';

const styles = defineStyles("PetrovDayStory", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // Custom scroll cursor with hotspot at (10,10) and pointer fallback
    cursor: 'url("/icons/scroll.png") 10 10, pointer',
    '& $image': {
      opacity: 0.6,
      transition: 'opacity 0.5s, filter 0.5s, -webkit-filter 0.5s',
      filter: 'contrast(1)',
    },
    '&:hover $image': {
      opacity: 1,
      filter: 'contrast(2)',
    },
  },
  rootSidebar: {
    width: "calc(90vw - 950px)",
    [theme.breakpoints.down(1400)]: {
      display: 'none',
    },
    height: "100vh",
    transition: 'opacity 0.5s, filter 0.5s, -webkit-filter 0.5s',
    position: "relative",
    overflowX: 'hidden',
    overflowY: 'scroll',
    // Prevent scroll chaining so the page doesn't continue scrolling into the rest of the site
    overscrollBehavior: 'contain',
    /* Hide scrollbars while retaining scroll functionality */
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  rootFullWidth: {
    width: "100vw",
  },
  gradientOverlayLeft: {
    // width: "50vw",
    // [theme.breakpoints.down(1700)]: {
    //   width: "40vw",
    // },
    // [theme.breakpoints.down(1500)]: {
    //   width: "30vw",
    // },
    width: "calc(90vw - 950px)",
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    height: "100vh",
    background: `linear-gradient(to left, 
                transparent 0%,
                ${theme.palette.background.default} 100%)`,
    pointerEvents: 'none',
  },
  blackBackground: {
    transition: 'opacity 0.5s',
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 4,
    background: "black",
  },
  gradientOverlayTop: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 1,
    // background: `linear-gradient(to top, 
    //             transparent 80%,
    //             ${theme.palette.background.default} 100%)`,
    pointerEvents: 'none',
  },
  imageColumn: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: "100vh",
    objectFit: 'cover',
    objectPosition: 'right',
    transition: 'opacity 0.5s',
    ['@media(max-width: 1450px)']: {
      // right: '-100px',
    },
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  image: {
    width: '100%',
    maxWidth: "calc(90vw - 950px)",
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'right',
    position: 'relative',
    zIndex: 0
  },
  storyContainer: {
    width: "100%",
    zIndex: 5,
    marginLeft: 'auto',
  },
  storyBuffer: {
    height: 920,
    [theme.breakpoints.down(1800)]: {
      height: 700,
    },
    width: "100vw",
    zIndex: 1,
    position: "relative", 
  },
  storySection: {
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingRight: 200,
    [theme.breakpoints.down(1900)]: {
      paddingRight: 80,
      paddingLeft: 80,
    },
    [theme.breakpoints.down(1550)]: {
      paddingRight: 50,
      paddingLeft: 50
    },
    [theme.breakpoints.down(1480)]: {
      paddingRight: 24,
      paddingLeft: 0
    },
  },
  preludeSectionContent: {
    "&&": {
      width: 400,
      [theme.breakpoints.down(1900)]: {
        width: 350,
      },
      [theme.breakpoints.down(1550)]: {
        width: 290,
      },
      marginRight: 0,
    },
  },
  storySectionContent: {
    width: 500,
    marginRight: 100,
    color: '#212121',
    transition: 'color 0.5s',
    '& h1': {
      fontSize: 60,
      textTransform: 'uppercase',
      marginBottom: 12,
      [theme.breakpoints.down(1900)]: {
        fontSize: 50,
      },
      [theme.breakpoints.down(1600)]: {
        fontSize: 40,
      },
    },
    '& h2': {
      fontSize: 22,
    },
    '& h3': {
      fontSize: 16,
      marginBottom: '42px !important',
      marginTop: '42px !important',
      opacity: 0.7,
    },
    '& blockquote': {
      color: "#e0e0e0",
    },
    '& em': {
      opacity: 0.75,
    },
  },
  storySectionContentWhite: {
    color: "#eeeeee",
  },
  storySectionDivider: {
    // borderTop: `1px solid white`,
    // backgroundColor: 'white',
    // background: 'white',
    // borderBottom: '1px solid white',
    marginTop: 200,
    marginBottom: 200,
    color: theme.palette.grey[200],
    opacity: 0.3,
    width: 200,
    marginRight: 80,
    borderBottom: '1px solid white',
  },
  candles: {
    position: 'fixed',
    transition: 'opacity 3s',
    bottom: 0,
    left: 120,
    height: "auto",
    width:  500,
    objectFit: 'cover',
    objectPosition: 'bottom',
    pointerEvents: 'none',
    zIndex: 10,
    mixBlendMode: 'screen',
  },
  storyScrollPosition: {
    position: 'fixed',
    top: 100,
    left: 100,
    zIndex: 10,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rosettaStone: {
    position: 'fixed',
    top: "7vh",
    left: "10vw",
    height: "80vh",
    objectFit: 'cover',
    objectPosition: 'right',
    transition: 'opacity 0.5s',
    zIndex: 10,
    mixBlendMode: 'screen',
  },
  hominidSkulls: {
    position: 'fixed',
    top: "14vh",
    left: "20vw",
    height: "60vh",
    zIndex: 10,
  }
}), {
  allowNonThemeColors: true
});

const ScrollVisibility = ({anchor, start, stop, scroll, children}: {
  anchor: string,
  start: number,
  stop: number,
  scroll: number,
  children: (visible: boolean) => React.ReactNode
}) => {
  const [anchorPos, setAnchorPos] = useState<{top: number, bottom:number}|null>(null);
  const {width: windowWidth, height: windowHeight} = useWindowSize();

  useEffect(() => {
    const anchorEl = document.getElementById(anchor);
    if (anchorEl) {
      const top = getOffsetChainTop(anchorEl);
      const bottom = top + anchorEl.clientHeight;
      setAnchorPos({top, bottom});
    } else {
      console.log(`Element with ID ${anchor} not found`);
    }
  }, [anchor, windowWidth, windowHeight]);

  const isVisible = (!!anchorPos
    && scroll > anchorPos.top + start
    && scroll < anchorPos.bottom + stop
  );
  
  if (anchorPos) {
    console.log(`scroll=${scroll}, top=${anchorPos.top + start}, bot=${anchorPos.bottom + stop}`);
  }

  return <>
    {children(isVisible)}
  </>
}

const BackgroundImage = ({isVisible, src, className, maxOpacity=1, inDuration=4, outDuration=0.5}: {
  isVisible: boolean,
  src: string,
  className?: string,
  maxOpacity?: number,
  inDuration?: number,
  outDuration?: number
}) => {
  const classes = useStyles(styles);
  return <img src={src} className={className}
    style={{
      pointerEvents: 'none',
      opacity: isVisible ? maxOpacity : 0,
      transition: isVisible ? `opacity ${inDuration}s` : `opacity ${outDuration}s`,
    }}
  />
}

const BackgroundVideo = ({anchor, start, stop, scroll, src, className, inDuration=4, outDuration=0.5}: {
  anchor?: string,
  start: number,
  stop: number,
  scroll: number,
  src: string,
  className: string,
  inDuration?: number,
  outDuration?: number
}) => {
  const classes = useStyles(styles);
  const isVisible = scroll > start && scroll < stop;
  return <video autoPlay loop playsInline muted className={className}
    style={{ opacity: isVisible ? 1 : 0, transition: isVisible ? `opacity ${inDuration}s` : `opacity ${outDuration}s` }}
  >
    <source src={src} type="video/mp4" />
  </video>
}

export const PetrovDayPage = () => {
  return <PetrovDayStory variant="page"/>
}

export default function PetrovDayStory({variant}: {
  variant: "sidebar"|"page"
}) {
  const classes = useStyles(styles);

  // Track whether the overall page has been scrolled, and whether the story container itself has been scrolled
  const [pageScrolled, setPageScrolled] = React.useState(false);
  const [storyScrolled, setStoryScrolled] = React.useState(false);
  const [storyScrollPosition, setStoryScrollPosition] = React.useState(0);

  // Handle top-level window scroll for fading out the entire story
  React.useEffect(() => {
    const handleWindowScroll = () => {
      if (variant === "page") {
        setStoryScrolled(window.scrollY > 0);
        setStoryScrollPosition(window.scrollY);
      } else {
        setPageScrolled(window.scrollY > 0);
      }
    };
    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  // Handle scrolling within the Petrov Day story container
  const handleStoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (variant === "sidebar") {
      setStoryScrolled(scrollTop > 0);
      setStoryScrollPosition(scrollTop);
    }
  };

  return (
    <AnalyticsContext pageSectionContext="petrovDayStory">
      <div
        className={classNames(classes.root, {
          [classes.rootSidebar]: variant==="sidebar",
          [classes.rootFullWidth]: storyScrolled
        })}
        {...(variant==="sidebar" && {
          style: {
            opacity: (pageScrolled && variant==="sidebar") ? 0 : 1,
            pointerEvents: (pageScrolled && variant==="sidebar") ? 'none' : 'auto'
          },
          onScroll: handleStoryScroll
        })}
      >
        <div className={classes.gradientOverlayLeft} />
        <div className={classes.blackBackground} style={{
          opacity: (storyScrolled || variant==="page") ? 1 : 0,
          pointerEvents: (storyScrolled || variant==="page") ? 'auto' : 'none'
        }}/>
        
        <div className={classes.gradientOverlayTop} />
        {/*<BackgroundImage start={500} stop={1500} scroll={storyScrollPosition} 
          className={classes.candles} src="/petrov/one-unlit-candle.jpg" />

        <BackgroundVideo start={1000} stop={5500} scroll={storyScrollPosition} 
          src="/petrov/1-candle.mp4" className={classes.candles} />*/}

        <ScrollVisibility
          anchor="hominid-skulls"
          start={-500} stop={500}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundImage
            isVisible={visible}
            className={classes.hominidSkulls}
            src="/petrov/hominid-skulls.jpg"
            maxOpacity={0.5} inDuration={6} outDuration={6}
          />}
        </ScrollVisibility>

        {/*<BackgroundVideo start={4500} stop={5100} scroll={storyScrollPosition} 
          src="/petrov/2-candles.mp4" className={classes.candles} />

        <BackgroundVideo start={5000} stop={10000} scroll={storyScrollPosition} 
          src="/petrov/3-candles.mp4" className={classes.candles} />

        <BackgroundImage start={5500} stop={7000} scroll={storyScrollPosition} 
          src="/petrov/rosetta-stone.jpg" maxOpacity={0.5} className={classes.rosettaStone} inDuration={6} outDuration={6} />*/}

        <div className={classes.imageColumn} style={{ opacity: (storyScrollPosition > 2000) ? 0 : 1 }}>
            <CloudinaryImage2 
              loading="lazy"
              className={classes.image}
              publicId="petrovBig_cblm82"
              darkPublicId={"petrovBig_cblm82"}
            />
        </div>
        <div className={classes.storyScrollPosition}>{storyScrollPosition}</div>
        <PetrovDayContents variant={variant} storyScrolled={storyScrolled}/>
      </div>
    </AnalyticsContext>
  );
}

const PetrovDayContents = React.memo(({variant, storyScrolled}: {
  variant: "sidebar"|"page",
  storyScrolled: boolean,
}) => {
  const classes = useStyles(styles);

  return <div className={classes.storyContainer}>
    <div className={classes.storyBuffer}/>
    {petrovDaySections.map((item, index: number) => (
      <div key={index} className={classes.storySection}>
        <ContentStyles
          contentType="postHighlight"
          className={classNames(classes.storySectionContent, {
            [classes.preludeSectionContent]: item.isPrelude && variant==="sidebar",
            [classes.storySectionContentWhite]: storyScrolled || variant==="page"
          })}
        >
          {item.getContents()}
        </ContentStyles>
        <div className={classes.storySectionDivider} style={{ marginRight: item.isPrelude ? 80: 260 }}/>
      </div>
    ))}
  </div>
})
