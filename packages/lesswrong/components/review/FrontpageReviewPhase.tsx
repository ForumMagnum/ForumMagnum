import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  timeRemaining: {
  },
  learnMore: {
    color: theme.palette.lwTertiary.main
  },
  subtitle: {
    width: "100%",
    display: 'flex',
    justifyContent: 'space-between'
  },
  reviewTimeline: {
    ...theme.typography.commentStyle,
    display: 'flex',
    marginBottom: 6,
    marginTop: -8
  },
  nominationBlock: {flexGrow: 1, marginRight: 2},
  reviewBlock: {flexGrow: 2, marginRight: 2},
  votingBlock: {flexGrow: 1},
  blockText: {color: 'white', zIndex: 1},
  progress: {
    position: 'relative',
    marginBottom: 2,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.14)',
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover': {
      boxShadow: "0px 0px 10px rgba(0,0,0,.1)",
      opacity: 0.9
    }
  },
  activeProgress: {
    backgroundColor: theme.palette.primary.light
  },
  coloredProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: theme.palette.primary.main
  },
  nominationDate: {}
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
      <div className={classes.reviewTimeline}>
        <div className={classes.nominationBlock}>
          <LWTooltip placement="top-start" title={reviewTooltip} className={classNames(classes.progress, classes.activeProgress)}>
            <div className={classes.blockText}>Nominations</div>
            <div className={classes.blockText}>Dec 14</div>
            <div className={classes.coloredProgress} style={{width: '35%'}}/>
          </LWTooltip>
        </div>
        <div className={classes.reviewBlock}>      
          <div className={classes.progress}>
            <div className={classes.blockText}>Reviews</div>
            <div className={classes.blockText}>Jan 11</div>
            <div className={classes.coloredProgress}/>
          </div>
        </div>
        <div className={classes.votingBlock}>
          <div className={classes.progress}>
            <div className={classes.blockText}>Votes</div>
            <div className={classes.blockText}>Jan 25</div>
            <div className={classes.coloredProgress}/>
          </div>
        </div>
      </div>
      {/* <SectionSubtitle className={classes.subtitle}>
        <div>
          <LWTooltip placement="top-start" title={reviewTooltip}>
            <Link to={"/reviews"}>
              The LessWrong 2018 Review
            </Link>
          </LWTooltip>
        </div>
        <div className={classes.timeRemaining}>
          <LWTooltip placement="top-start" title={reviewTooltip}>
            <em>You have until Dec 14th to nominate posts (<span className={classes.learnMore}>
              <HoverPreviewLink href="/posts/qXwmMkEBLL59NkvYR/the-lesswrong-2018-review" innerHTML={"learn more"}/>
            </span>)</em>
          </LWTooltip>
        </div>
      </SectionSubtitle> */}
      
      <AnalyticsContext listContext={"LessWrong 2019 Review"} capturePostItemOnMount>
        <RecommendationsList algorithm={reviewAlgorithm} />
      </AnalyticsContext>
      {/* <SectionFooter>
        <Link to={"/reviews"}>
          Reviews Dashboard
        </Link>
        {currentUser && <Link to={`/users/${currentUser.slug}/reviews`}>
          My Reviews
        </Link>}
      </SectionFooter> */}
    </div>
  )
}

const FrontpageReviewPhaseComponent = registerComponent('FrontpageReviewPhase', FrontpageReviewPhase, {styles});

declare global {
  interface ComponentTypes {
    FrontpageReviewPhase: typeof FrontpageReviewPhaseComponent
  }
}

