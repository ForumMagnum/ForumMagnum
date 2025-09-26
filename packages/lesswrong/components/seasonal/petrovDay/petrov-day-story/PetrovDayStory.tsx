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
import ForumIcon from '@/components/common/ForumIcon';
import LWTooltip from '@/components/common/LWTooltip';

const styles = defineStyles("PetrovDayStory", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: "100vw",
    '& $image': {
      opacity: 0.5,
      transition: 'opacity 0.5s, filter 0.5s, -webkit-filter 0.5s',
      filter: 'contrast(1)',
    },
    [theme.breakpoints.up(1400)]: {
      '&:hover $image': {
        opacity: 1,
        filter: 'contrast(2)',
      },
    }
  },
  rootSidebar: {
    [theme.breakpoints.down(1400)]: {
      display: 'none',
    },
    width: "calc(90vw - 950px)",
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
    transition: 'opacity .5s, filter 0.5s',
  },
  imageColumnPage: {
    width: "100vw",
  },
  image: {
    width: '100%',
    maxWidth: "calc(90vw - 950px)",
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'unset',
    },
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'right',
    position: 'relative',
    zIndex: 0
  },
  imagePage: {
    objectPosition: 'top right',
  },
  imageStoryPage: {
    '&&': {
      width: '100%',
      maxWidth: 'unset',
    },
  },
  storyContainer: {
    width: "100%",
    zIndex: 15,
    marginLeft: 'auto',
  },
  storyBuffer: {
    height: 920,
    [theme.breakpoints.down(1800)]: {
      height: 700,
    },
    [theme.breakpoints.down('xs')]: {
      height: 300,
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
    [theme.breakpoints.down('xs')]: {
      alignItems: 'center',
      paddingRight: 16,
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
    [theme.breakpoints.down('md')]: {
      width: 400,
      marginRight: 20,
    },
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      paddingRight: 10,
      paddingLeft: 10,
      marginRight: 0,
    },
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
    marginTop: 200,
    marginBottom: 200,
    marginRight: 80,
    [theme.breakpoints.down('xs')]: {
      marginTop: 100,
      marginBottom: 100,
      marginRight: 0,
    },
    color: "#eeeeee",
    opacity: .5,
    width: 200,
    borderBottom: `1px solid #f5f5f5`,
  },
  storySectionDividerPage: {
    marginRight: 260,
    [theme.breakpoints.down('md')]: {
      marginRight: 130,
    },
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
    },
  },
  candles: {
    position: 'fixed',
    transition: 'opacity 3s',
    bottom: 0,
    left: 120,
    height: "auto",
    maxHeight: 400,
    width:  500,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
    objectFit: 'cover',
    objectPosition: 'bottom',
    pointerEvents: 'none',
    zIndex: 12,
    [theme.breakpoints.down('md')]: {
      left: 0,
      zIndex: 100,
    },
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
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  hominidSkulls: {
    position: 'fixed',
    top: "10vh",
    left: "10vw",
    height: "60vh",
    zIndex: 10,
    [theme.breakpoints.down('lg')]: {
      height: "50vh",
    },
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  petrov: {
    position: 'fixed',
    top: "14vh",
    left: "5vw",
    height: "60vh",
    zIndex: 10,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  arkhipov: {
    position: 'fixed',
    top: "14vh",
    left: "12vw",
    height: "60vh",
    zIndex: 10,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  earth: {
    position: 'fixed',
    top: "0vh",
    left: "0vw",
    zIndex: 5,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  arrowUp: {
    position: 'fixed',
    fontSize: 32,
    top: 100,
    left: 50,
    zIndex: 20,
    transition: 'opacity 0.2s',
    cursor: 'pointer',
    '&:hover': {
      opacity: `1 !important`,
    },
  },
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
  const [anchorPos, setAnchorPos] = useState<{top: number, bottom: number}|null>(null);

  useEffect(() => {
    const anchorEl = document.getElementById(anchor);
    if (anchorEl) {
      const top = getOffsetChainTop(anchorEl);
      const bottom = top + anchorEl.clientHeight;
      setAnchorPos({top, bottom});
    } else {
      // eslint-disable-next-line no-console
      console.log(`Element with ID ${anchor} not found`);
    }
  }, [anchor]);

  const isVisible = (!!anchorPos
    && anchorPos.bottom > anchorPos.top
    && scroll > anchorPos.top + start
    && scroll < anchorPos.bottom + stop
  );

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
  return <img src={src} className={className}
    loading="lazy"
    style={{
      pointerEvents: 'none',
      opacity: isVisible ? maxOpacity : 0,
      transition: isVisible ? `opacity ${inDuration}s` : `opacity ${outDuration}s`,
    }}
  />
}

const BackgroundVideo = ({isVisible, src, className, maxOpacity=1, inDuration=4, outDuration=0.5, autoPlay=false}: {
  isVisible: boolean,
  src: string,
  className: string,
  maxOpacity?: number,
  inDuration?: number,
  outDuration?: number,
  autoPlay: boolean
}) => {
  return <video autoPlay loop playsInline muted className={className}
    style={{ opacity: isVisible ? maxOpacity : 0, transition: isVisible ? `opacity ${inDuration}s` : `opacity ${outDuration}s` }}
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
  const [storyScrollPosition, setStoryScrollPosition] = useState(0);

  // Ref to the story container so we can programmatically scroll it (sidebar variant)
  const storyContainerRef = React.useRef<HTMLDivElement>(null);

  // Smoothly scroll to the top when the arrow-up icon is clicked
  const handleScrollToTop = () => {
    if (variant === "page") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      storyContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Disable page scrolling when the Petrov Day story itself is being scrolled
  React.useEffect(() => {
    if (storyScrolled && variant === "sidebar") {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'contain';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [storyScrolled, variant]);

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
  }, [variant]);

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
        ref={storyContainerRef}
        {...(variant==="sidebar" && {
          style: {
            opacity: (pageScrolled && variant==="sidebar") ? 0 : 1,
            pointerEvents: (pageScrolled && variant==="sidebar") ? 'none' : 'auto'
          },
          onScroll: handleStoryScroll
        })}
      >
        <LWTooltip title="Back to top">
          <ForumIcon icon="Close" className={classes.arrowUp} onClick={handleScrollToTop}style={{
              opacity: (storyScrollPosition > 1000 && variant==="sidebar" ) ? .25 : 0,
              pointerEvents: (storyScrolled) ? 'auto' : 'none'
            }}
          />
        </LWTooltip>
        <div className={classNames(classes.gradientOverlayLeft, {
          [classes.imageStoryPage]: variant==="page"
        })} />
        <div className={classes.blackBackground} style={{
          opacity: (storyScrolled) ? 1 : 0,
          pointerEvents: (storyScrolled || variant==="page") ? 'auto' : 'none'
        }}/>
        
        <div className={classes.gradientOverlayTop} />

        <ScrollVisibility
          anchor="one-unlit-candle"
          start={-500} stop={1500}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundImage
            isVisible={visible}
            className={classes.candles}
            src="/petrov/one-unlit-candle.jpg"
            maxOpacity={1} inDuration={6} outDuration={6}
          />}
        </ScrollVisibility>

{/* 
        <BackgroundVideo start={1000} stop={5500} scroll={storyScrollPosition} 
          src="/petrov/1-candle.mp4" className={classes.candles} /> */}

        <ScrollVisibility
          anchor="prometheus"
          start={-1000} stop={2000}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/1-candle.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="2nd-candle"
          start={-350} stop={350}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/2-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="3rd-candle"
          start={-350} stop={350}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/3-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="3brd-candle"
          start={-350} stop={350}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/3b-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="3c-candle"
          start={-1000} stop={1000}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/3-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="4th-candle"
          start={-1000} stop={250}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            isVisible={visible}
            className={classes.candles}
            autoPlay={storyScrolled}
            src="/petrov/4-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="4bth-candle"
          start={-500} stop={500}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/4b-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="4cth-candle"
          start={-500} stop={3000}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/4-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="5th-candle"
          start={-500} stop={500}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/5-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="bad-candle"
          start={-500} stop={250}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/5+bad.candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="7th-candle"
          start={-500} stop={250}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/7-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="last-candle"
          start={-500} stop={10000}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundVideo
            autoPlay={storyScrolled}
            isVisible={visible}
            className={classes.candles}
            src="/petrov/8-candles.mp4" inDuration={4} outDuration={4}
          />}
        </ScrollVisibility>


        <ScrollVisibility
          anchor="hominid-skulls"
          start={-500} stop={1000}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundImage
            isVisible={visible}
            className={classes.hominidSkulls}
            src="/petrov/hominid-skulls.jpg"
            maxOpacity={0.8}
             inDuration={6} outDuration={2}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="rosetta-stone"
          start={-500} stop={500}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundImage
            isVisible={visible}
            className={classes.rosettaStone}
            src="/petrov/rosetta-stone.jpg"
            maxOpacity={0.5} inDuration={6} outDuration={6}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="arkhipov"
          start={-1000} stop={100}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundImage
            isVisible={visible}
            className={classes.arkhipov}
            src="/petrov/arkhipov.jpg"
            maxOpacity={0.75} inDuration={6} outDuration={3}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="petrov1"
          start={-1000} stop={1000}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundImage
            isVisible={visible}
            className={classes.petrov}
            src="/petrov/petrov.jpg"
            maxOpacity={0.75} inDuration={6} outDuration={6}
          />}
        </ScrollVisibility>

        <ScrollVisibility
          anchor="coda"
          start={-1000} stop={1000}
          scroll={storyScrollPosition}
        >
          {visible => <BackgroundImage
            isVisible={visible}
            className={classes.earth}
            src="/petrov/earth.mp4"
            maxOpacity={0.75} inDuration={6} outDuration={6}
          />}
        </ScrollVisibility>

        <div className={classNames(classes.imageColumn, {
          [classes.imageColumnPage]: variant==="page"
        })} style={{ 
          opacity: (storyScrolled) ? 0 : 1,

         }}>
          <CloudinaryImage2 
            loading="lazy"
            className={classNames(classes.image, {
              [classes.imageStoryPage]: variant==="page",
              [classes.imagePage]: variant==="page"
            })}
            publicId="petrovBig_cblm82"
            darkPublicId={"petrovBig_cblm82"}
          />
        </div>
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
      <div key={index} className={classes.storySection} id={index.toString()}>
        <ContentStyles
          contentType="postHighlight"
          className={classNames(classes.storySectionContent, {
            [classes.preludeSectionContent]: item.isPrelude && variant==="sidebar",
            [classes.storySectionContentWhite]: storyScrolled
          })}
        >
          {item.getContents()}
        </ContentStyles>
        <div className={classNames(classes.storySectionDivider, {
          [classes.storySectionDividerPage]: variant==="page" || !item.isPrelude
        })}/>
      </div>
    ))}
  </div>
})
