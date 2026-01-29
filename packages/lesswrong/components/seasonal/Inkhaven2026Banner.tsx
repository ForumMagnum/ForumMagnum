import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import CloudinaryImage2 from "../common/CloudinaryImage2";

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
    width: '400px',
    height: 'auto',
    objectFit: 'contain',
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
    width: '400px',
    [theme.breakpoints.down(1200)]: {
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
    maxWidth: '300px',
    marginLeft: 'auto',
    textAlign: 'right',
  },
  cohortBadge: {
    ...theme.typography.commentStyle,
    fontSize: '14px',
    fontWeight: 500,
    opacity: 0.8,
    marginBottom: 4,
  },
}));

export const Inkhaven2026Banner = () => {
  const classes = useStyles(styles);

  return (
    <AnalyticsContext pageSectionContext="inkhaven2026Banner">
      <div className={classes.root}>
        <div className={classes.imageColumn}>
          <CloudinaryImage2
            loading="lazy"
            className={classes.image}
            publicId="benitopace_in_an_orb_a_cute_little_mouse_is_sitting_in_its_hot__f27fefa8-6325-448c-befb-04655b8c940e_mvhgw0"
            darkPublicId="e172921e-982f-4fde-a30d-35837955acb6_l1fdhw"
          />
          <div className={classes.gradientOverlayDown} />
          <div className={classes.gradientOverlayLeft} />
        </div>
        <div className={classes.inkhavenBannerText}>
          <div className={classes.cohortBadge}>Cohort #2</div>
          <h2><a href="https://www.inkhaven.blog">Inkhaven</a></h2>
          <div className={classes.inkhavenBannerDateAndLocation}>
            A month-long writing residency. Publish a blogpost every day for 30 days. April 1–30, 2026 in Berkeley, CA. Scholarships available.
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
