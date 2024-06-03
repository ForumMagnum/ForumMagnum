import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { alternateHomePageSetting, showReviewOnFrontPageIfActive } from '../../lib/publicSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { useDisplayedPost } from '../posts/usePost';
import { useApolloClient } from '@apollo/client';

const LWHome = () => {
  const { DismissibleSpotlightItem, RecentDiscussionFeed, AnalyticsInViewTracker, FrontpageReviewWidget,
    SingleColumnSection, FrontpageBestOfLWWidget, EAPopularCommentsSection,
    QuickTakesSection, LWHomePosts, AlternateHomePage, Loading
  } = Components

  const apolloClient = useApolloClient();
  const postPreload = apolloClient.cache.readFragment<PostsListWithVotes>({
    fragment: getFragment("PostsListWithVotes"),
    fragmentName: "PostsListWithVotes",
    id: 'Post:FtsyWwJLdTapN3c6h',
  });
  
  const { document: fullPost, loading } = useDisplayedPost('FtsyWwJLdTapN3c6h', null);

  let mungedPost = fullPost;
  if (fullPost) {
    mungedPost = {
      ...fullPost,
      reviewWinner: {
        _id: '',
        category: 'optimization',
        competitorCount: null,
        curatedOrder: 0,
        isAI: true,
        postId: '',
        reviewRanking: 0,
        // reviewRanking: '😜' as unknown as number,
        reviewYear: 2025,
        reviewWinnerArt: {
          _id: '',
          postId: '',
          splashArtImagePrompt: '',
          splashArtImageUrl: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711758958/ohabryka_Solarpunk_band_poster_fade_to_yellow_eb4a63fd-03ea-472f-a656-d6d152a2f268_fdu41f.png',
          activeSplashArtCoordinates: {
            _id: '',
            leftFlipped: false,
            leftHeightPct: 100,
            leftWidthPct: 100,
            leftXPct: 100,
            leftYPct: 100,
            middleFlipped: false,
            middleHeightPct: 100,
            middleWidthPct: 100,
            middleXPct: 100,
            middleYPct: 100,
            rightFlipped: false,
            rightHeightPct: 100,
            rightWidthPct: 100,
            rightXPct: 100,
            rightYPct: 100,
            reviewWinnerArtId: ''
          },
        }
      }
    };
  }

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          <UpdateLastVisitCookie />
          {alternateHomePageSetting.get() && loading && <Loading />}
          {alternateHomePageSetting.get() && !loading
            ? <AlternateHomePage fullPost={mungedPost} postPreload={postPreload ?? undefined} />
            :
            <>
              {reviewIsActive() && getReviewPhase() === "RESULTS" && <SingleColumnSection>
                <FrontpageBestOfLWWidget reviewYear={REVIEW_YEAR}/>
              </SingleColumnSection>}
              {reviewIsActive() && getReviewPhase() !== "RESULTS" && showReviewOnFrontPageIfActive.get() && <SingleColumnSection>
                <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
              </SingleColumnSection>}
              <SingleColumnSection>
                <DismissibleSpotlightItem current/>
              </SingleColumnSection>
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
            </>
          }
        </React.Fragment>
      </AnalyticsContext>
  )
}

const UpdateLastVisitCookie = () => {
  const [_, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  }, [setCookie])
  
  return <></>
}

const LWHomeComponent = registerComponent('LWHome', LWHome);

declare global {
  interface ComponentTypes {
    LWHome: typeof LWHomeComponent
  }
}
