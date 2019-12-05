import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper.js';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser'
import {AnalyticsContext} from "../../lib/analyticsEvents";

const styles = theme => ({
  timeRemaining: {
    marginTop: 6,
    marginBottom: 4
  },
  learnMore: {
    color: theme.palette.lwTertiary.main
  }
})

const FrontpageReviewPhase = ({classes, settings, currentUser}) => {
  const { SubSection, SectionSubtitle, SectionFooter, PostsList2, HoverPreviewLink } = Components

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
      <Tooltip placement="top-start" title={reviewTooltip}>
        <div>
          <SectionSubtitle >
            <Link to={"/reviews"}>
              The LessWrong 2018 Review
            </Link>
            <div className={classes.timeRemaining}>
              <em>You have until Dec 31st to review posts (<span className={classes.learnMore}>
                <HoverPreviewLink href="/posts/qXwmMkEBLL59NkvYR/the-lesswrong-2018-review" innerHTML={"learn more"}/>
              </span>)</em>
            </div>
          </SectionSubtitle>
        </div>
      </Tooltip>
      <SubSection>
        <AnalyticsContext listContext={"LessWrong 2018 Review NEW"}>
          <PostsList2 terms={{view:"reviews2018", limit: 3}} showLoadMore={false} />
        </AnalyticsContext>
      </SubSection>
      <SectionFooter>
        <Link to={"/reviews"}>
          Reviews Dashboard
        </Link>
        {(currentUser && currentUser.karma >= 1000) && <Link to={`/users/${currentUser.slug}/nominations`}>
          My Reviews
        </Link>}
      </SectionFooter>
    </div>
  )
}

registerComponent('FrontpageReviewPhase', FrontpageReviewPhase, withUser, withStyles(styles, {name:"FrontpageReviewPhase"}));
