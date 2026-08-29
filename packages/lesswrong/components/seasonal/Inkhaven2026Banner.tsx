import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import CloudinaryImage2 from "../common/CloudinaryImage2";

// Frontpage campaign: 10 days from 2026-08-28.
export const INKHAVEN_RESIDENCY_3_SPOTLIGHT_ID = 'SbqCm443KuNuxoZKt';
export const INKHAVEN_RESIDENCY_3_START = new Date('2026-08-28T00:00:00-07:00');
export const INKHAVEN_RESIDENCY_3_END = new Date('2026-09-07T00:00:00-07:00');
const INKHAVEN_RESIDENCY_3_BANNER_PUBLIC_ID = 'ChatGPT_Image_Aug_29_2026_09_46_57_AM_uynuti';

const styles = defineStyles("Inkhaven2026Banner", (theme: ThemeType) => ({
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
    height: 'auto',
    maxHeight: '96vh',
    objectFit: 'contain',
    objectPosition: 'right top',
    display: 'block',
    // Wider/shorter asset than the previous plume; keep origin top-right and
    // scale up so the typewriter scene stays a similar size in the gutter.
    transform: 'translate(calc(-38px + (0.6 * clamp(2.5rem, 3vw, 4rem) * 1.2)), calc(-2vh - 10px - (1.4 * clamp(2.5rem, 3vw, 4rem) * 1.2)))',
    transformOrigin: 'top right',
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100vh',
    width: '560px',
    [theme.breakpoints.down(1200)]: {
      display: 'none'
    },
  },
  inkhavenBannerText: {
    ...theme.typography.postStyle,
    position: 'absolute',
    right: 16,
    bottom: 88,
    color: theme.palette.greyAlpha(0.87),
    textShadow: `0 0 3px ${theme.palette.background.default}, 0 0 3px ${theme.palette.background.default}`,
    textAlign: 'right',
    width: 500,
    [theme.breakpoints.down(1600)]: {
      width: 400,
    },
    [theme.breakpoints.down(1380)]: {
      width: 360
    },
    [theme.breakpoints.down(1280)]: {
      width: 320,
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
    '& button': {
      ...theme.typography.commentStyle,
      backgroundColor: theme.palette.primary.main,
      opacity: 0.9,
      border: 'none',
      color: theme.palette.text.alwaysWhite,
      borderRadius: '3px',
      textAlign: 'center',
      padding: '8px 14px',
      cursor: 'pointer',
      '&:hover': {
        opacity: 1,
      },
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
    maxWidth: 365,
    [theme.breakpoints.down(1380)]: {
      maxWidth: 320,
    },
    [theme.breakpoints.down(1280)]: {
      maxWidth: 280,
    },
    marginLeft: 'auto',
    textAlign: 'right',
  },
  noWidow: {
    whiteSpace: 'nowrap',
  },
}));

export const Inkhaven2026Banner = () => {
  const classes = useStyles(styles);

  return (
    <AnalyticsContext pageSectionContext="inkhaven2026Banner">
      <div className={classes.root}>
        <div className={classes.imageColumn}>
          <CloudinaryImage2
            publicId={INKHAVEN_RESIDENCY_3_BANNER_PUBLIC_ID}
            objectFit="contain"
            imgProps={{c: "limit", g: "auto", f: "png"}}
            className={classes.image}
          />
        </div>
        <div className={classes.inkhavenBannerText}>
          <h2><a href="https://www.inkhaven.blog">Inkhaven<br /><span className={classes.noWidow}>Residency #3</span></a></h2>
          <div className={classes.inkhavenBannerDateAndLocation}>
            A month-long writing residency. Publish a blogpost every day for 30 days. Nov 10–Dec 11, 2026 in Berkeley, CA. <span className={classes.noWidow}>Scholarships available.</span>
          </div>
          <div style={{display: 'inline-block', alignItems: 'center'}}>
            <a href="https://www.inkhaven.blog" target="_blank" rel="noopener noreferrer"><button>Apply Now</button></a>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default Inkhaven2026Banner;
