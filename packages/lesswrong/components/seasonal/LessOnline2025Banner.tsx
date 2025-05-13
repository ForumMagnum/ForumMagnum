import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import CloudinaryImage2 from "../common/CloudinaryImage2";

const styles = defineStyles("LessOnline2025Banner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndexes.frontpageSplashImage,
    pointerEvents: 'none',
    [theme.breakpoints.down(1200)]: {
      display: 'none',
    },
  },
  image: {
    width: '100%',
    height: '80vh',
    objectFit: 'cover',
    objectPosition: 'right',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(ellipse at top right, 
                transparent 35%,
                ${theme.palette.background.default} 63%)`,
    pointerEvents: 'none',
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: '0px',
    height: "100vh",
    width: '34vw',
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  lessOnlineBannerText: {
    ...theme.typography.postStyle,
    position: 'fixed',
    right: 16,
    bottom: 80,
    color: theme.palette.greyAlpha(0.87),
    textShadow: `0 0 3px ${theme.palette.background.default}, 0 0 3px ${theme.palette.background.default}`,
    textAlign: 'right',
    width: 500,
    [theme.breakpoints.down(1450)]: {
      width: 300,
    },
    [theme.breakpoints.down(1380)]: {
      width: 200
    },
    pointerEvents: 'auto',
    '& h2': {
      fontSize: 'clamp(2.5rem, 3vw, 4rem)',
      lineHeight: '1.2',
      margin: 0,
      '& a': {
        color: 'inherit',
        textDecoration: 'none',
      }
    },
    '& h3': {
      fontSize: 'clamp(1.5rem, 1.5vw, 2.2rem)',
      margin: 0,
      lineHeight: '1.2',
      marginBottom: 8
    },
    '& button': {
      ...theme.typography.commentStyle,
      backgroundColor: theme.palette.primary.main,
      opacity: 0.8,
      border: 'none',
      color: theme.palette.text.alwaysWhite,
      borderRadius: '3px',
      textAlign: 'center',
      padding: '8px 14px',
      cursor: 'pointer',
      '& a': {
        color: 'inherit',
        textDecoration: 'none',
      },
      fontWeight: '600',
      fontSize: '22px',
    }
  },
  lessOnlineBannerDateAndLocation: {
    ...theme.typography.commentStyle,
    fontSize: '16px !important',
    fontStyle: 'normal',
    marginBottom: '16px !important',
    maxWidth: '300px',
    marginLeft: 'auto',
    textAlign: 'right',
  },
}));

export const LessOnline2025Banner = ({priceIncreaseDate}: {priceIncreaseDate: Date}) => {
  const classes = useStyles(styles);
  const timeRemaining = priceIncreaseDate.getTime() - new Date().getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  const countdownText = daysRemaining > 0 
    ? `in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}` 
    : 'tomorrow';

  return (
    <AnalyticsContext pageSectionContext="lessOnline2025Banner">
      <div className={classes.root}>
        <div className={classes.imageColumn}>
            <CloudinaryImage2
              loading="lazy"
              className={classes.image}
              publicId="ChatGPT_Image_Mar_27_2025_07_12_57_PM_yngfv5.png"
            />
            <div className={classes.gradientOverlay} />
        </div>
        <div className={classes.lessOnlineBannerText}>
          <h2><a href="http://less.online">LessOnline 2025</a></h2>
          <h3>Ticket prices increase {countdownText}</h3>
          <div className={classes.lessOnlineBannerDateAndLocation}>Join our Festival of Blogging and Truthseeking from May 30 - Jun 1, Berkeley, CA</div>
          <a href="http://less.online/" target="_blank" rel="noopener noreferrer"><button>Buy Tickets</button></a>
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent('LessOnline2025Banner', LessOnline2025Banner);



