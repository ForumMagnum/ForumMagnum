import CloudinaryImage2 from '@/components/common/CloudinaryImage2';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import React from 'react';
import { petrovDaySections } from './petrovDaySections';
import { heightElements } from 'juice';

const styles = defineStyles("PetrovDayStory", (theme: ThemeType) => ({
  root: {
    width: "50vw",
    height: "100vh",
    transition: 'opacity 0.5s',
    paddingLeft: 250,
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
    marginTop: 100,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
  gradientOverlayBottom: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 1,
    background: `linear-gradient(to bottom, 
                transparent 60%,
                ${theme.palette.background.default} 100%)`,
    pointerEvents: 'none',
  },
  gradientOverlayTop: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 1,
    background: `linear-gradient(to top, 
                transparent 80%,
                ${theme.palette.background.default} 100%)`,
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
      right: '-100px',
    },
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'right',
    position: 'relative',
    right: -574,
  },
  storyContainer: {
    width: 400,
    marginTop: 100,
    [theme.breakpoints.down(1700)]: {
      width: 300,
    },
    [theme.breakpoints.down(1500)]: {
      width: 250,
    },
  },
  storyBuffer: {
    height: 500,
    width: "100vw",
    zIndex: 1,
    position: "relative",
  },
  storySection: {
    position: "relative",
    zIndex: 0,
    paddingTop: 50,
    paddingBottom: 50,
  },
  storySectionContent: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    padding: 50,
    [theme.breakpoints.down(1500)]: {
      padding: 25,
    },
    borderRadius: 2,
    ...theme.typography.postStyle,
  },
}));

export default function PetrovDayStory() {
  const classes = useStyles(styles);

  // Track whether the overall page has been scrolled, and whether the story container itself has been scrolled
  const [pageScrolled, setPageScrolled] = React.useState(false);
  const [storyScrolled, setStoryScrolled] = React.useState(false);

  // Handle top-level window scroll for fading out the entire story
  React.useEffect(() => {
    const handleWindowScroll = () => {
      setPageScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  // Handle scrolling within the Petrov Day story container
  const handleStoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setStoryScrolled(scrollTop > 0);
  };

  return (
    <AnalyticsContext pageSectionContext="petrovDayStory">
      <div className={classes.root} style={{opacity: pageScrolled ? 0 : 1}} onScroll={handleStoryScroll}>
        <div className={classes.gradientOverlayLeft} />
        <div className={classes.gradientOverlayBottom} />
        <div className={classes.gradientOverlayTop} />
        <div className={classes.imageColumn} style={{ opacity: storyScrolled ? 0 : 1 }}>
          <CloudinaryImage2 
            loading="lazy"
            className={classes.image}
            publicId="petrovBig_byok45"
            darkPublicId={"petrovBig_byok45"}
          />
        </div>
        <div className={classes.storyContainer}>
          <div className={classes.storyBuffer}/>
          {petrovDaySections.map((item: { html: string}, index: number) => (
            <div key={index} className={classes.storySection}>
              <div className={classes.storySectionContent} key={index} dangerouslySetInnerHTML={{ __html: item.html }} />
            </div>
          ))}
        </div>
      </div>
    </AnalyticsContext>
  );
}
