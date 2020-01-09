import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper.jsx';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { reviewAlgorithm } from "./FrontpageReviewPhase";

const styles = theme => ({
  timeRemaining: {
    marginTop: 6,
    marginBottom: 4
  },
  learnMore: {
    color: theme.palette.primary.main
  }
})

const FrontpageVotingPhase = ({classes, settings, currentUser}) => {
  const { SubSection, SectionSubtitle, SectionFooter, RecommendationsList, HoverPreviewLink } = Components

  const reviewTooltip = <div>
    <div>The LessWrong community is reflecting on the best posts from 2018, in three phases</div>
    <ul>
      <li><em>Nomination</em> (Nov 21 – Dec 1st)</li>
      <li><em>Review</em> (Dec 2nd – Jan 19th)</li>
      <li><em>Voting</em> (Jan 7th – 19th</li>
      <li>The LessWrong moderation team will incorporate that information, along with their judgment, into a "Best of 2018" book.</li>
    </ul>
    <div>(Currently this section shows 2018 posts with at least 2 nominations)</div>
  </div>

  if (settings.hideReview) return null

  return (
    <div>
      <Tooltip placement="top-start" title={reviewTooltip}>
        <div>
          <SectionSubtitle >
            <Link to={"/reviews"}>
              The 2018 Review (Voting Phase)
            </Link>
            {(currentUser && currentUser.karma >= 1000) && <div className={classes.timeRemaining}>
              <em><Link to="/reviewVoting" className={classes.learnMore}>Cast your votes</Link>, as well as finish reviewing and editing posts by Jan 19th (<span className={classes.learnMore}>
                <HoverPreviewLink href="/posts/qXwmMkEBLL59NkvYR/the-lesswrong-2018-review" innerHTML={"learn more"}/>
              </span>)</em>
            </div>}
          </SectionSubtitle>
        </div>
      </Tooltip>
      <SubSection>
        <AnalyticsContext listContext={"Voting on the LW 2018 Review"} capturePostItemOnMount>
          <RecommendationsList algorithm={reviewAlgorithm} showLoginPrompt={false} />
        </AnalyticsContext>
      </SubSection>
      <SectionFooter>
        {(currentUser && currentUser.karma >= 1000) && <Link to={`/reviewVoting`}>
          My Votes
        </Link>}
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

registerComponent('FrontpageVotingPhase', FrontpageVotingPhase, withUser, withStyles(styles, {name:"FrontpageVotingPhase"}));
