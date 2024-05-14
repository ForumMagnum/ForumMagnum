import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { showReviewOnFrontPageIfActive } from '../../lib/publicSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { commentBodyStyles, postBodyStyles, smallPostStyles } from '../../themes/stylePiping';
import { SECTION_WIDTH } from './SingleColumnSection';
import { Link } from '../../lib/reactRouterWrapper';

export const styles = (theme: ThemeType) => ({
  spotlight: {
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 16,
    borderRadius: 3,
    marginBottom: 16,
    ...smallPostStyles(theme),
    position: "relative",
    [theme.breakpoints.down('md')]: {
      maxWidth: SECTION_WIDTH,
      margin: "auto",
      marginBottom: 16,
    }
  },
  spotlightText: {
    width: "calc(100% - 150px)",
    '& p': {
      ...commentBodyStyles(theme),
      '& a': {
        color: theme.palette.primary.main
      }
    },
    '& h3': {
      ...theme.typography.headerStyle,
      marginBottom: 8
    },
    '& h4': {
      fontSize: "1.2rem",
      fontStyle: "italic",
      marginBottom: 4,
      marginTop: 4,
    },
    zIndex: 1,
    position: "relative",
    background: `linear-gradient(to right, ${theme.palette.background.pageActiveAreaBackground} 230px, transparent calc(230px + 30%))`
  },
  spotlightImage: {
    height: "100%",
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 0,
    filter: "saturate(2.5)"
  },
  button: {
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    padding: '4px 12px',
    borderRadius: 3,
    textDecoration: "none",
    display: "inline-block",
    marginTop: 8,
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  }
})


const LWHome = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { DismissibleSpotlightItem, RecentDiscussionFeed, AnalyticsInViewTracker, FrontpageReviewWidget, 
    SingleColumnSection, FrontpageBestOfLWWidget, EAPopularCommentsSection, QuickTakesSection, LWHomePosts, CloudinaryImage2 } = Components
  const [_, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  }, [setCookie])

  const { captureEvent } = useTracking();


  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>

          {reviewIsActive() && getReviewPhase() === "RESULTS" && <SingleColumnSection>
            <FrontpageBestOfLWWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
          {reviewIsActive() && getReviewPhase() !== "RESULTS" && showReviewOnFrontPageIfActive.get() && <SingleColumnSection>
            <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
          {/* TODO: remove this after LessOnline sale */}
          <div className={classes.spotlight}>
            <div className={classes.spotlightText}>
              <h3><Link to={"/posts/MmWziepD8DDauSide/lessonline-festival-updates-thread"}>LessOnline Festival</Link></h3>
              <h4>Ticket Prices increase tomorrow</h4>
              <p>Join us May 31st - June 2nd, in Berkeley CA for a festival of truth-seeking, optimization, and blogging. <span className={classes.hideOnMobile}>We'll have writing workshops, rationality classes, puzzle hunts, and thoughtful conversations across a sprawling fractal campus of nooks and whiteboards.</span></p>
              <p><a className={classes.button} onClick={() => captureEvent('frontpageCTAButtonClicked')} href="https://less.online" target="_blank" rel="noreferrer">Buy Tickets</a></p>
            </div>
            <CloudinaryImage2
              publicId={"spotlight3_ubpxgr"}
              darkPublicId={"darkmodespot3_zvefab"}
              className={classes.spotlightImage}
            />  
          </div>
          <AnalyticsInViewTracker
            eventProps={{inViewType: "homePosts"}}
            observerProps={{threshold:[0, 0.5, 1]}}
          >
            <LWHomePosts>
              <QuickTakesSection />
    
              <EAPopularCommentsSection />
    
              <RecentDiscussionFeed
                af={false}
                commentsLimit={4}
                maxAgeHours={18}
              />
            </LWHomePosts>
          </AnalyticsInViewTracker>
        </React.Fragment>
      </AnalyticsContext>
  )
}

const LWHomeComponent = registerComponent('LWHome', LWHome, {styles});

declare global {
  interface ComponentTypes {
    LWHome: typeof LWHomeComponent
  }
}
