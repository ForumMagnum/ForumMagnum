import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser'
import {AnalyticsContext} from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  timeRemaining: {
    marginTop: 6,
    marginBottom: 4
  },
  learnMore: {
    color: theme.palette.lwTertiary.main
  }
})

export const reviewAlgorithm = {
  method: "sample",
  count: 3,
  scoreOffset: 0,
  scoreExponent: 0,
  personalBlogpostModifier: 0,
  frontpageModifier: 0,
  curatedModifier: 0,
  review2018: true, 
  onlyUnread: false,
  excludeDefaultRecommendations: true
}

const FrontpageReviewPhase = ({classes, settings}) => {
  const { SectionSubtitle, SectionFooter, RecommendationsList, HoverPreviewLink, LWTooltip } = Components
  const currentUser = useCurrentUser();

  const reviewTooltip = <div>
    <div>The LessWrong community is reflecting on the best posts from 2018, in three phases</div>
    <ul>
      <li><em>Nomination</em> (Nov 21 – Dec 1st)</li>
      <li><em>Review</em> (Dec 2nd – 31st)</li>
      <li><em>Voting</em> (Jan 1st – 7th</li>
      <li>The LessWrong moderation team will incorporate that information, along with their judgment, into a "Best of 2018" book.</li>
    </ul>
    <div>(Currently this section shows 2018 posts with at least 2 nominations)</div>
  </div>

  if (settings.hideReview) return null

  return (
    <div>
      <LWTooltip placement="top-start" title={reviewTooltip}>
        <div>
          <SectionSubtitle >
            <Link to={"/reviews"}>
              The LessWrong 2018 Review
            </Link>
            <div className={classes.timeRemaining}>
              <em>You have until Jan 13th to review and edit posts (<span className={classes.learnMore}>
                <HoverPreviewLink href="/posts/qXwmMkEBLL59NkvYR/the-lesswrong-2018-review" innerHTML={"learn more"}/>
              </span>)</em>
            </div>
          </SectionSubtitle>
        </div>
      </LWTooltip>
      <AnalyticsContext listContext={"LessWrong 2018 Review"} capturePostItemOnMount>
        <RecommendationsList algorithm={reviewAlgorithm} />
      </AnalyticsContext>
      <SectionFooter>
        <Link to={"/reviews"}>
          Reviews Dashboard
        </Link>
        {currentUser && <Link to={`/users/${currentUser.slug}/reviews`}>
          My Reviews
        </Link>}
      </SectionFooter>
    </div>
  )
}

const FrontpageReviewPhaseComponent = registerComponent('FrontpageReviewPhase', FrontpageReviewPhase, {styles});

declare global {
  interface ComponentTypes {
    FrontpageReviewPhase: typeof FrontpageReviewPhaseComponent
  }
}

