import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import CloudinaryImage2 from "../common/CloudinaryImage2";
import { useCurrentTime } from '@/lib/utils/timeUtil';

const styles = defineStyles("LessOnline2026Banner", (theme: ThemeType) => ({
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
    height: '92vh',
    objectFit: 'cover',
    objectPosition: 'right',
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: '0px',
    height: "120vh",
    width: '44vw',
    maskImage: `linear-gradient(to bottom, ${theme.palette.greyAlpha(1)} 18%, ${theme.palette.greyAlpha(0.82)} 38%, ${theme.palette.greyAlpha(0.48)} 54%, ${theme.palette.greyAlpha(0.22)} 66%, ${theme.palette.greyAlpha(0)} 76%)`,
    WebkitMaskImage: `linear-gradient(to bottom, ${theme.palette.greyAlpha(1)} 18%, ${theme.palette.greyAlpha(0.82)} 38%, ${theme.palette.greyAlpha(0.48)} 54%, ${theme.palette.greyAlpha(0.22)} 66%, ${theme.palette.greyAlpha(0)} 76%)`,
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  leftFade: {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(to right, ${theme.palette.background.default} 0%, ${theme.palette.background.translucentBackgroundHeavy} 12%, ${theme.palette.background.translucentBackground} 28%, ${theme.palette.background.transparent} 56%)`,
  },
  bannerText: {
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
  dateAndLocation: {
    ...theme.typography.commentStyle,
    fontSize: '16px !important',
    fontStyle: 'normal',
    marginBottom: '16px !important',
    maxWidth: '300px',
    marginLeft: 'auto',
    textAlign: 'right',
  },
}));

export const LessOnline2026Banner = ({earlyBirdEndDate}: {earlyBirdEndDate: Date}) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  const timeRemaining = earlyBirdEndDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const earlyBirdActive = timeRemaining > 0;

  const countdownText = daysRemaining > 0
    ? `in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    : daysRemaining === 0
    ? 'today'
    : null;
  const buttonPrice = earlyBirdActive ? '$550' : '$675';

  return (
    <AnalyticsContext pageSectionContext="lessOnline2026Banner">
      <div className={classes.root}>
        <div className={classes.imageColumn}>
          <CloudinaryImage2
            loading="lazy"
            className={classes.image}
            publicId="t_fliph/v1773986020/LessOnline/lessonline_2026_sidebanner_6.png"
          />
          <div className={classes.leftFade} />
        </div>
        <div className={classes.bannerText}>
          <h2><a href="http://less.online">LessOnline 2026</a></h2>
          {countdownText && <h3>Early bird tickets increase {countdownText}</h3>}
          <div className={classes.dateAndLocation}>Join our Festival of Blogging and Truthseeking from Jun 5 - Jun 7, Berkeley, CA</div>
          <a href="http://less.online/" target="_blank" rel="noopener noreferrer"><button>Buy Tickets — {buttonPrice}</button></a>
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default LessOnline2026Banner;
