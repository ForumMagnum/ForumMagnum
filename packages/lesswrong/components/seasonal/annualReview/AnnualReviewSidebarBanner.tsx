import React from 'react';
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CloudinaryImage2 from "@/components/common/CloudinaryImage2";
import { 
  REVIEW_YEAR, 
  getReviewTitle, 
  getReviewPhase, 
  getReviewStart,
  getNominationPhaseEnd, 
  getReviewPhaseEnd, 
  getNominationPhaseEndDisplay,
  getReviewPhaseEndDisplay,
  getVotingPhaseEndDisplay,
  getResultsPhaseEnd,
  reviewPostPath,
  type ReviewPhase,
} from '@/lib/reviewUtils';
import { allPostsParams } from '@/lib/collections/posts/helpers';
import qs from 'qs';
import moment from 'moment';

function isWithin24Hours(date: moment.Moment) {
  const diff = date.diff(new Date());
  return diff > 0 && diff < (24 * 60 * 60 * 1000);
}

const styles = defineStyles("AnnualReviewSidebarBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100%',
    zIndex: theme.zIndexes.frontpageSplashImage,
    pointerEvents: 'none',
    [theme.breakpoints.down(1200)]: {
      display: 'none',
    },
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: "100vh",
    width: '640px',
    pointerEvents: 'auto',
    ['@media(max-width: 1720px)']: {
      right: -100,
    },
    ['@media(max-width: 1550px)']: {
      right: -200,
    },
    ['@media(max-width: 1450px)']: {
      right: -250,
    },
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'left',
    transform: 'scaleX(-1)',
  },
  gradientOverlayDown: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(to bottom, 
                transparent 50%,
                ${theme.palette.background.default} 70%)`,
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
  textContainer: {
    ...theme.typography.postStyle,
    position: 'absolute',
    right: 16,
    bottom: 80,
    color: theme.palette.greyAlpha(0.87),
    textAlign: 'right',
    width: 500,
    [theme.breakpoints.down(1600)]: {
      width: 300,
    },
    [theme.breakpoints.down(1380)]: {
      width: 200
    },
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  title: {
    fontSize: 'clamp(2.5rem, 3vw, 4rem)',
    lineHeight: '1.2',
    margin: 0,
    color: 'inherit',
    textDecoration: 'none',
    '& a': {
      color: 'inherit',
      textDecoration: 'none',
    }
  },
  subtitle: {
    ...theme.typography.postStyle,
    fontSize: 'clamp(1.5rem, 1.5vw, 2rem)',
    lineHeight: '1.2',
    margin: 0,
    marginBottom: 0,
    textAlign: 'right',
    textShadow: 'none',
    color: 'inherit',
    whiteSpace: 'nowrap',
  },
  description: {
    ...theme.typography.commentStyle,
    fontSize: '16px !important',
    fontStyle: 'normal',
    maxWidth: 300,
    textBalance: 'auto',
    marginLeft: 'auto',
    textAlign: 'right',
    color: 'inherit',
    marginBottom: 8,
    '& p': {
      marginTop: 0,
      marginBottom: 8,
    }
  },
  timeRemaining: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.grey[500],
    marginLeft: 12
  },
  actionButton: {
    ...theme.typography.commentStyle,
    backgroundColor: theme.palette.primary.main,
    opacity: 0.8,
    border: 'none',
    color: theme.palette.text.alwaysWhite,
    borderRadius: '3px',
    textAlign: 'center',
    padding: '8px 14px',
    cursor: 'pointer',
    display: 'inline-block',
    textShadow: 'none',
    '&:hover': {
      textDecoration: 'none',
      opacity: 1,
    },
    fontWeight: '500',
    fontSize: '22px',
  }
}));

function formatPhaseDateRange(startDate: moment.Moment, endDate: moment.Moment) {
  if (startDate.month() === endDate.month()) {
    return `${startDate.format('MMMM D')}-${endDate.format('D')}`;
  }
  return `${startDate.format('MMM D')} - ${endDate.format('MMM D')}`;
}

const commonIntro = "Each December, the LessWrong community reviews the best blogposts of yesteryear.";

interface PhaseConfig {
  phaseName: string;
  phaseDescription: string;
  buttonLabel: string;
  getDateRange: () => { start: moment.Moment; end: moment.Moment };
  getButtonLink: () => string;
}

const nominatePostsLink = `/nominatePosts/${REVIEW_YEAR}?${qs.stringify(allPostsParams(REVIEW_YEAR))}`;
const reviewPostsLink = `/reviewVoting`;

const phaseConfigs: Partial<Record<ReviewPhase, PhaseConfig>> = {
  NOMINATIONS: {
    phaseName: "Nomination",
    phaseDescription: "In the nomination phase, we identify posts worthy of consideration in the review.",
    buttonLabel: "Nominate Now",
    getDateRange: () => ({
      start: getReviewStart(REVIEW_YEAR),
      end: getNominationPhaseEndDisplay(REVIEW_YEAR),
    }),
    getButtonLink: () => nominatePostsLink,
  },
  REVIEWS: {
    phaseName: "Discussion",
    phaseDescription: "In the discussion phase, we review and debate posts. Posts that receive one written review move to the final voting phase.",
    buttonLabel: "Review Now",
    getDateRange: () => ({
      start: getNominationPhaseEnd(REVIEW_YEAR),
      end: getReviewPhaseEndDisplay(REVIEW_YEAR),
    }),
    getButtonLink: () => reviewPostsLink,
  },
  VOTING: {
    phaseName: "Voting",
    phaseDescription: "In the final voting phase, we do a full voting pass. The outcome determines Best of LessWrong results.",
    buttonLabel: "Vote Now",
    getDateRange: () => ({
      start: getReviewPhaseEnd(REVIEW_YEAR),
      end: getVotingPhaseEndDisplay(REVIEW_YEAR),
    }),
    getButtonLink: () => reviewPostsLink,
  },
  RESULTS: {
    phaseName: "Results",
    phaseDescription: "Voting is complete! See which posts made it into the Best of LessWrong.",
    buttonLabel: "View Results",
    getDateRange: () => ({
      start: getVotingPhaseEndDisplay(REVIEW_YEAR),
      end: getResultsPhaseEnd(REVIEW_YEAR),
    }),
    getButtonLink: () => reviewPostsLink,
  },
};

export const AnnualReviewSidebarBanner = () => {
  const classes = useStyles(styles);
  
  const activePhase = getReviewPhase(REVIEW_YEAR);
  
  if (activePhase === "UNSTARTED" || activePhase === "COMPLETE") {
    return null;
  }

  const config = phaseConfigs[activePhase];
  if (!config) return null;

  const { start, end } = config.getDateRange();
  const subtitle = `${config.phaseName} | ${formatPhaseDateRange(start, end)}`;

  return (
    <AnalyticsContext pageSectionContext="AnnualReviewSidebarBanner">
      <div className={classes.root}>
        <div className={classes.imageColumn}>
          <CloudinaryImage2
            loading="lazy"
            className={classes.image}
            publicId="ruby_37_annual_review_banner_2025_cropped"
            darkPublicId="Generated_Image_November_26_2025_-_1_21PM_rtfv62"
          />
          <div className={classes.gradientOverlayDown} />
          <div className={classes.gradientOverlayLeft} />
        </div>
        
        <div className={classes.textContainer}>
          <h1 className={classes.title}>
            <a href={reviewPostPath}>
              {getReviewTitle(REVIEW_YEAR)}
            </a>
          </h1>
          <div className={classes.subtitle}>
            {subtitle}
          </div>
          
          <div className={classes.description}>
            <p>{commonIntro}</p>
            <p>{config.phaseDescription}</p>
          </div>
          
          <a href={config.getButtonLink()} className={classes.actionButton}>
            {config.buttonLabel}
          </a>

          {isWithin24Hours(end) && (
            <span className={classes.timeRemaining}>{end.fromNow()} remaining</span>
          )}
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default AnnualReviewSidebarBanner;

