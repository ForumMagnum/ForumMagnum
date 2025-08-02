import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import CloudinaryImage2 from "../common/CloudinaryImage2";

const styles = defineStyles("Inkhaven2025Banner", (theme: ThemeType) => ({
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
    width: '160%',
    height: '84vh',
    objectFit: 'cover',
    objectPosition: 'right',
    position: 'relative',
    right: '-70px',
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
    right: '30px',
    height: "100vh",
    width: '640px',
    ['@media(max-width: 1450px)']: {
      right: '-100px',
    },
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  inkhavenBannerText: {
    ...theme.typography.postStyle,
    position: 'fixed',
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
          <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1754080752/benito2692_httpss.mj.runyDVzPpvb3Kw_httpss.mj.runw1QRA5VJzn0_Pa_6687e73d-a1af-4911-86b3-bd6d4b18d242_ysez8s.png" alt="Inkhaven 2025 Banner" className={classes.image} />
            <div className={classes.gradientOverlay} />
        </div>
        <div className={classes.inkhavenBannerText}>
          <h2><a href="https://www.lesswrong.com/posts/CA6XfmzYoGFWNhH8e/whence-the-inkhaven-residency">The Inkhaven Residency</a></h2>
          <h3>November 1-30 | Lighthaven, CA</h3>
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



