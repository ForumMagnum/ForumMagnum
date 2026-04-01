import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useSubscribedLocation, useLocation } from '@/lib/routeUtil';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CloudinaryImage2 from "@/components/common/CloudinaryImage2";
import { isHomeRoute, isRouteWithLeftNavigationColumn } from '@/lib/routeChecks';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SOLSTICE_GLOBE_COOKIE } from '@/lib/cookies/cookies';
import { SolsticeSeasonBanner } from '../seasonal/solsticeSeason/SolsticeSeasonBanner';
import { Inkhaven2026Banner } from '../seasonal/Inkhaven2026Banner';
import { LessOnline2026Banner } from '../seasonal/LessOnline2026Banner';
import withErrorBoundary from '@/components/common/withErrorBoundary';
import { getReviewPhase, reviewIsActive, reviewResultsPostPath } from '@/lib/reviewUtils';
import ReviewVotingCanvas from '../review/ReviewVotingCanvas';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { Link } from '@/lib/reactRouterWrapper';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';

// Inkhaven Cohort #2 banner active period
const INKHAVEN_2026_START = new Date('2026-01-10T00:00:00-08:00');
const INKHAVEN_2026_END = new Date('2026-02-01T00:00:00-08:00');

function useIsInkhaven2026Active(): boolean {
  const now = useCurrentTime();
  return now >= INKHAVEN_2026_START && now < INKHAVEN_2026_END;
}

// LessOnline 2026 banner active period
const LESSONLINE_2026_START = new Date('2026-03-17T00:00:00-07:00');
const LESSONLINE_2026_EARLY_BIRD_END = new Date('2026-04-08T00:00:00-07:00');
const LESSONLINE_2026_END = new Date('2026-03-26T00:00:00-07:00');

function useIsLessOnline2026Active(): { active: boolean; earlyBirdEndDate: Date } {
  const now = useCurrentTime();
  return {
    active: now >= LESSONLINE_2026_START && now < LESSONLINE_2026_END,
    earlyBirdEndDate: LESSONLINE_2026_EARLY_BIRD_END,
  };
}

const styles = defineStyles("LWBackgroundImage", (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  backgroundImage: {
    position: 'absolute',
    width: '57vw',
    maxWidth: '1000px',
    top: '-70px',
    right: '-334px',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 55%, transparent 70%)`,
    
    [theme.breakpoints.up(2000)]: {
      right: '0px',
    }
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: "100vh",
    width: '57vw',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
    overflowX: 'clip',
  },
  showSolsticeButton: {
    position: 'fixed',
    bottom: 12,
    right: '12vw',
    zIndex: 10,
    ...theme.typography.commentStyle,
    background: "transparent",
    border: 'none',
    borderRadius: 3,
    fontSize: 14,
    fontWeight: 400,
    cursor: 'pointer',
    padding: '8px 16px',
    opacity: 0.5,
    transition: 'opacity 0.2s ease-out',
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down(1425)]: {
      display: 'none',
    },
  },
  reviewVotingCanvas: {
    position: 'absolute',
    width: '57vw',
    height: '100vh',
    '& img': {
      width: '100%',
      height: '100vh',
      position: 'relative',
      right: -40,
      objectFit: 'cover',
    },
    maxWidth: '1000px',
    top: '-57px',
    right: '-334px',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 55%, transparent 70%)`,
    
    [theme.breakpoints.up(2000)]: {
      right: '0px',
    }
  },
  votingResultsLink: {
    position: 'absolute',
    zIndex: theme.zIndexes.reviewVotingCanvas,
    top: 715,
    right: 250,
    width: 200,
    opacity: .6,
    textAlign: 'center',
    display: 'block',
    '&:hover': {
      opacity: .4,
    },
    [theme.breakpoints.down(1600)]: {
      right: 100,
      top: 690
    },
    [theme.breakpoints.down(1400)]: {
      right: 35,
      top: 650
    },
    '& h1': {
      ...theme.typography.headerStyle,
      fontSize: '2.8rem',
      lineHeight: '2.6rem',
      fontWeight: 600,
      marginTop: 20,
      marginBottom: 0,
    },
    '& h3': {
      ...theme.typography.commentStyle,
      fontSize: '1.4rem',
      lineHeight: '1.2',
      marginTop: 16,
      marginBottom: 6,
      fontStyle: 'italic',
      opacity: .5,
    }
  },
}));

function isNewspaperActive(query: Record<string, string>, isHomePage: boolean): boolean {
  if (!isHomePage) return false;
  if (query.newspaper === 'true') return true;
  if (query.newspaper === 'false') return false;
  const now = new Date();
  return now.getMonth() === 3 && now.getDate() === 1; // April 1st
}

export const LWBackgroundImage = () => {
  const classes = useStyles(styles);
  const pathname = usePrerenderablePathname();
  const isHomePage = isHomeRoute(pathname);
  const { query } = useLocation();

  // Hide background art when newspaper frontpage is active
  if (isNewspaperActive(query, isHomePage)) {
    return <div className={classes.root} />;
  }

  const [cookies, setCookie] = useCookiesWithConsent([HIDE_SOLSTICE_GLOBE_COOKIE]);
  const hideGlobeCookie = cookies[HIDE_SOLSTICE_GLOBE_COOKIE] === "true";

  const standaloneNavigation = isRouteWithLeftNavigationColumn(pathname);
  const defaultImage = standaloneNavigation ? <div className={classes.imageColumn}> 
    {/* Background image shown in the top-right corner of LW. The
    * loading="lazy" prevents downloading the image if the
    * screen-size is such that the image will be hidden by a
    * breakpoint. */}
    <CloudinaryImage2
      loading="lazy"
      className={classes.backgroundImage}
      publicId="ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413"
      darkPublicId={"ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413_copy_lnopmw"}
    />
  </div> : null

  // TODO: clean up related code in FundraisingThermometer when we disable/remove solstice season.
  // let homePageImage = (standaloneNavigation && isHomePage && !hideGlobeCookie) ? <SolsticeSeasonBanner /> : defaultImage
  
  // Show event banners on homepage during active periods. LessOnline takes precedence over Inkhaven.
  let homePageImage = defaultImage;
  const inkhaven2026Active = useIsInkhaven2026Active();
  const lessOnline2026 = useIsLessOnline2026Active();
  if (standaloneNavigation && isHomePage) {
    if (lessOnline2026.active) {
      homePageImage = <LessOnline2026Banner earlyBirdEndDate={lessOnline2026.earlyBirdEndDate} />;
    } else if (inkhaven2026Active) {
      homePageImage = <Inkhaven2026Banner />;
    }
  }

  // if (reviewIsActive() && standaloneNavigation && isHomePage) {
  //   homePageImage = <AnnualReviewSidebarBanner />
  // }

  // const showSolsticeButton = standaloneNavigation && isHomePage && hideGlobeCookie

  // if (reviewIsActive() && getReviewPhase() === 'VOTING' && isHomePage && standaloneNavigation) {
  //   homePageImage = <ReviewVotingCanvas />
  // }

  const reviewCompleteImage = <div className={classes.imageColumn}>
    <Link className={classes.votingResultsLink} to={reviewResultsPostPath}>
      <h1>Thank YOU for Voting!</h1>
      <h3>View Results</h3>
    </Link>
    <CloudinaryImage2
      loading="lazy"
      className={classes.backgroundImage}
      publicId="happyWizard_mmmnjx"
      darkPublicId={"happyWizard_mmmnjx"}
    />
  </div>;

  if (getReviewPhase() === 'RESULTS' && isHomePage && standaloneNavigation) {
    homePageImage = reviewCompleteImage;
  }

  return <div className={classes.root}>
    {homePageImage}
    {/* {showSolsticeButton && (
      <button
        className={classes.showSolsticeButton}
        onClick={() => setCookie(HIDE_SOLSTICE_GLOBE_COOKIE, "false")}
      >
        Show Solstice Season
      </button>
    )} */}
  </div>;
}

export default registerComponent('LWBackgroundImage', LWBackgroundImage, {
  areEqual: "auto",
  hocs: [withErrorBoundary],
});


