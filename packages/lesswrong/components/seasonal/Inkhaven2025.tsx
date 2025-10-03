import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import CloudinaryImage2 from "../common/CloudinaryImage2";

const styles = defineStyles("Inkhaven2025Banner", (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndexes.frontpageSplashImage,
    pointerEvents: 'none',
    height: '100vh',
    [theme.breakpoints.down(1200)]: {
      display: 'none',
    },
  },
  image: {
    width: '100%',
    height: '90vh',
    objectFit: 'cover',
    objectPosition: 'right',
    position: 'relative',
    right: '-27px',
  },
  gradientOverlayDown: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(to bottom, 
                transparent 50%,
                ${theme.palette.background.default} 90%)`,
    pointerEvents: 'none',
  },
  gradientOverlayLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(to left, 
                transparent 50%,
                ${theme.palette.background.default} 95%)`,
    pointerEvents: 'none',
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: "100vh",
    width: '640px',
    ['@media(max-width: 1650px)']: {
      right: -100,
    },
    ['@media(max-width: 1550px)']: {
      right: -250,
    },
    ['@media(max-width: 1450px)']: {
      right: -350,
    },
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  inkhavenBannerText: {
    ...theme.typography.postStyle,
    position: 'absolute',
    right: 16,
    bottom: 80,
    color: theme.palette.greyAlpha(0.87),
    textShadow: `0 0 3px ${theme.palette.background.default}, 0 0 3px ${theme.palette.background.default}`,
    textAlign: 'right',
    width: 500,
    [theme.breakpoints.down(1600)]: {
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
      fontSize: 'clamp(1.5rem, 1.5vw, 2rem)',
      margin: 0,
      lineHeight: '1.2',
      marginTop: 0,
      marginBottom: 32
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
  inkhavenBannerDateAndLocation: {
    ...theme.typography.commentStyle,
    fontSize: '16px !important',
    fontStyle: 'normal',
    marginBottom: '16px !important',
    maxWidth: '300px',
    marginLeft: 'auto',
    textAlign: 'right',
  },
}));

export const Inkhaven2025Banner = () => {
  const classes = useStyles(styles);

  return (
    <AnalyticsContext pageSectionContext="inkhaven2025Banner">
      <div className={classes.root}>
        <div className={classes.imageColumn}>
          <CloudinaryImage2
            loading="lazy"
            className={classes.image}
            publicId="cottage_nqt3ca"
            darkPublicId={"6708cdec-a442-4f75-b633-c9f8ff5d0aa0_sa5hlr"}
          />
          <div className={classes.gradientOverlayDown} />
          <div className={classes.gradientOverlayLeft} />
        </div>
        <div className={classes.inkhavenBannerText}>
          <h2><a href="https://www.lesswrong.com/posts/CA6XfmzYoGFWNhH8e/whence-the-inkhaven-residency">Inkhaven</a></h2>
          <h3>Apply by Sept 30th</h3>
          <div className={classes.inkhavenBannerDateAndLocation}>Want to become a great internet writer? Join us for an intense month of daily blogging.          </div>
          <div style={{display: 'inline-block', alignItems: 'center'}}>
            <a href="https://www.inkhaven.blog" target="_blank" rel="noopener noreferrer"><button>Apply Now</button></a>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent('Inkhaven2025Banner', Inkhaven2025Banner);



