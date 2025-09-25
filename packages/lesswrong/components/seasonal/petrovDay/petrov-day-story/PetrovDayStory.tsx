import CloudinaryImage2 from '@/components/common/CloudinaryImage2';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import React from 'react';
import { petrovDaySections } from './petrovDaySectionsFinal';
import { heightElements } from 'juice';
import { postBodyStyles } from '@/themes/stylePiping';
import ContentStyles from '@/components/common/ContentStyles';

const styles = defineStyles("PetrovDayStory", (theme: ThemeType) => ({
  root: {
    height: "100vh",
    width: "50vw",
    transition: 'opacity 0.5s, filter 0.5s, -webkit-filter 0.5s',
    paddingLeft: 250,
    position: "relative",
    [theme.breakpoints.down(1700)]: {
      paddingLeft: 150,
      width: "40vw",
    },
    [theme.breakpoints.down(1500)]: {
      paddingLeft: 50,
      width: "30vw",
    },
    overflowX: 'hidden',
    overflowY: 'scroll',
    /* Hide scrollbars while retaining scroll functionality */
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    marginTop: 100,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // Custom scroll cursor with hotspot at (10,10) and pointer fallback
    cursor: 'url("/icons/scroll.png") 10 10, pointer',
    '& img': {
      opacity: 0.6,
      transition: 'opacity 0.5s, filter 0.5s, -webkit-filter 0.5s',
      filter: 'contrast(1)',
    },
    '&:hover img': {
      opacity: 1,
      filter: 'contrast(2)',
    },
  [theme.breakpoints.down(1400)]: {
      display: 'none',
    },
  },
  gradientOverlayLeft: {
    width: "50vw",
    [theme.breakpoints.down(1700)]: {
      width: "40vw",
    },
    [theme.breakpoints.down(1500)]: {
      width: "30vw",
    },
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
    background: theme.palette.text.alwaysBlack,
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
    width: "auto",
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
    maxWidth: 800,
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'right',
    position: 'relative',
    zIndex: 0,
  },
  storyContainer: {
    width: 600,
    marginTop: 100,
    zIndex: 5,

  },
  storyBuffer: {
    height: 475,
    width: "100vw",
    zIndex: 1,
    position: "relative",
  },
  storySection: {
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storySectionContent: {
    width: 400,
    transition: 'color 0.5s',
    [theme.breakpoints.down(1700)]: {
      width: 300,
    },
    [theme.breakpoints.down(1500)]: {
      width: 250,
    },
    '& h1': {
      fontSize: 50,
      textTransform: 'uppercase',
      marginBottom: -20,
    },
    '& h2': {
      fontSize: 30,
    },
    '& h3': {
      fontSize: 18,
      marginBottom: 48,
      marginTop: 48,
      opacity: 0.7,
    },
    '& blockquote': {
      color: theme.palette.text.alwaysLightGrey,
    },
  },
  storySectionDivider: {
    // borderTop: `1px solid white`,
    // backgroundColor: 'white',
    // background: 'white',
    // borderBottom: '1px solid white',
    marginTop: 120,
    marginBottom: 120,
    color: theme.palette.text.alwaysLightGrey,
    opacity: 0.5,
    width: '50%',
    borderBottom: '1px solid white',
  }
}));

export default function PetrovDayStory() {
  const classes = useStyles(styles);

  // Track whether the overall page has been scrolled, and whether the story container itself has been scrolled
  const [pageScrolled, setPageScrolled] = React.useState(false);
  const [storyScrolled, setStoryScrolled] = React.useState(false);

  // Handle top-level window scroll for fading out the entire story
  React.useEffect(() => {
    const handleWindowScroll = () => {
      console.log({storyScrolled});
      if (storyScrolled) {
        return;
      }
      setPageScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  // Handle scrolling within the Petrov Day story container
  const handleStoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (pageScrolled) {
      return;
    }
    setStoryScrolled(scrollTop > 0);
  };

  return (
    <AnalyticsContext pageSectionContext="petrovDayStory">
      <div className={classes.root} style={{opacity: pageScrolled ? 0 : 1, pointerEvents: pageScrolled ? 'none' : 'auto'}} onScroll={handleStoryScroll}>
        <div className={classes.gradientOverlayLeft} />
        <div className={classes.blackBackground} style={{ opacity: storyScrolled ? 1 : 0, pointerEvents: storyScrolled ? 'auto' : 'none', backgroundColor: pageScrolled ? "red" : 'blue' }}/>
        <div className={classes.gradientOverlayTop} />
        <div className={classes.imageColumn} style={{ opacity: storyScrolled ? 0 : 1 }}>
          <CloudinaryImage2 
            loading="lazy"
            className={classes.image}
            publicId="petrovBig_cblm82"
            darkPublicId={"petrovBig_cblm82"}
          />
        </div>
        <div className={classes.storyContainer}>
          <div className={classes.storyBuffer}/>
          {petrovDaySections.map((item: { html: string}, index: number) => (
            <div key={index} className={classes.storySection}>
              <ContentStyles contentType="post" className={classes.storySectionContent} style={{ color: storyScrolled ? "white" : "black" }}>
                <div className={classes.storySectionContent} key={index} dangerouslySetInnerHTML={{ __html: item.html }} />
              </ContentStyles>
              <div className={classes.storySectionDivider}/>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsContext>
  );
}
