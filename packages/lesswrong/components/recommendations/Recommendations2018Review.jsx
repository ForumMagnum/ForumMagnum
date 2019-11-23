import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper.js';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  hideOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
})

const Recommendations2018Review = ({classes, settings}) => {
  const { SubSection, SectionSubtitle, RecommendationsList, SectionFooter } = Components

  const reviewTooltip = <div>
    <div>The LessWrong community is reflecting on the best posts from 2018.</div>
    <ul>
      <li>Users with 1000+ karma can nominate posts until the end of December 1st</li>
      <li>During December, users can submit reviews of posts with at least 2 nominations</li>
      <li>The first week of January, users with 1000+ karma will rank posts with at least 1 review</li>
      <li>The LessWrong moderation team will incorporate that information, along with their judgment, into a "Best of 2018" book.</li>
    </ul>
    <div>(Currently this section displays a randomized sample of all posts from 2018, weighted by karma)</div>
  </div>

  const review2018TopUrl = "/allPosts?after=2018-01-01&before=2019-01-01&limit=100&timeframe=allTime"
  const review2018MonthlyUrl = "/allPosts?after=2018-01-01&before=2019-01-01&limit=14&timeframe=monthly&includeShortform=false&reverse=true"

  if (settings.hideReview) return null

  return (
    <div>
      <Tooltip placement="top-start" title={reviewTooltip}>
        <Link to={"/nominations"}>
          <SectionSubtitle >
            The LessWrong 2018 Review
          </SectionSubtitle>
        </Link>
      </Tooltip>
      <SubSection>
        <RecommendationsList algorithm={{...settings, review2018: true, excludeDefaultRecommendations: true}} showLoginPrompt={false} />
      </SubSection>
      <SectionFooter>
        <Link to={"/nominations"}>
          View{" "}<span className={classes.hideOnMobile}>All{" "}</span>Nominations
        </Link>
        <Link to={review2018TopUrl}>
          Top 2018<span className={classes.hideOnMobile}>{" "}Posts</span>
        </Link>
        <Link to={review2018MonthlyUrl}>
          2018<span className={classes.hideOnMobile}>{" "}Posts</span>{" "}Monthly
        </Link>
      </SectionFooter>
    </div>
  )
}

registerComponent('Recommendations2018Review', Recommendations2018Review, withStyles(styles, {name:"Recommendations2018Review"}));
