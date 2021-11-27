import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import classNames from 'classnames';
import { currentUserCanVote } from './ReviewVotingPage';
import { forumTitleSetting, forumTypeSetting } from '../../lib/instanceSettings';
import { annualReviewEnd, annualReviewNominationPhaseEnd, annualReviewReviewPhaseEnd, annualReviewStart } from '../../lib/publicSettings';
import moment from 'moment';
import { eligibleToNominate } from './NominatePostMenuItem';

const isEAForum = forumTypeSetting.get() === "EAForum"

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
  nominationBlock: {flexGrow: 1, marginRight: 2, flexBasis: 0},
  reviewBlock: {flexGrow: 2, marginRight: 2, flexBasis: 0},
  votingBlock: {flexGrow: 1, flexBasis: 0},
  blockText: {
    color: 'white',
    zIndex: 1,
    whiteSpace: "nowrap",
  },
  blockLabel: {
    marginRight: 10,
  },
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
    backgroundColor: isEAForum ? theme.palette.primary.main : 'rgba(127, 175, 131, 0.5)'
  },
  coloredProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: isEAForum ? theme.palette.lwTertiary.main : 'rgba(127, 175, 131, 0.7)'
  },
  nominationDate: {},
  actionButtonRow: {
    textAlign: "right",
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 8
  },
  actionButtonCTA: {
    backgroundColor: theme.palette.primary.main,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 3,
    color: "white",
    ...theme.typography.commentStyle,
    display: "inline-block"
  },
  actionButton: {
    border: `solid 1px ${theme.palette.grey[400]}`,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 3,
    color: theme.palette.grey[600],
    ...theme.typography.commentStyle,
    display: "inline-block",
    marginRight: 12
  }
})

export const reviewAlgorithm: RecommendationsAlgorithm = {
  method: "sample",
  count: 3,
  scoreOffset: 0,
  scoreExponent: 0,
  personalBlogpostModifier: 0,
  frontpageModifier: 0,
  curatedModifier: 0,
  includePersonal: true,
  includeMeta: true,
  reviewReviews: 2019, 
  onlyUnread: false,
  excludeDefaultRecommendations: true
}

const FrontpageReviewPhase = ({classes}: {classes: ClassesType}) => {
  const { SectionTitle, SettingsButton, SingleColumnSection, RecommendationsList, LWTooltip } = Components
  const currentUser = useCurrentUser();
  
  const nominationStartDate = moment(annualReviewStart.get())
  const nominationEndDate = moment(annualReviewNominationPhaseEnd.get())
  const reviewEndDate = moment(annualReviewReviewPhaseEnd.get())
  const voteEndDate = moment(annualReviewEnd.get())
  const currentDate = moment(new Date())

  const overviewToolip = <div>
    <div>The LessWrong community is reflecting on the best posts from 2019, in three phases</div>
    <ul>
      <li><em>Nomination</em> ({nominationStartDate.format('MMM Do')} – {nominationEndDate.format('MMM Do')})</li>
      <li><em>Review</em> ({nominationEndDate.clone().add(1, 'day').format('MMM Do')} – {reviewEndDate.format('MMM Do')})</li>
      <li><em>Voting</em> ({reviewEndDate.clone().add(1, 'day').format('MMM Do')} – {voteEndDate.format('MMM Do')})</li>
      <li>The LessWrong moderation team will incorporate that information, along with their judgment, into a "Best of 2019" book.</li>
    </ul>
    <div>(Currently this section shows a random sample of 2019 posts, weighted by karma)</div>
  </div>

  const nominationsTooltip = <div>
    <div>Nominate posts for the 2019 Review</div>
    <ul>
      <li>Any post from 2019 can be nominated</li>
      <li>Any user registered before 2019 can nominate posts for review</li>
      <li>A post requires two nominations to progress to the review phase</li>
    </ul>
    <div>If you've been actively reading LessWrong in 2019, but didn't register an account, message us on Intercom</div>
  </div>

  const reviewTooltip = <div>
    <div>Review posts for the 2019 Review (Opens {nominationEndDate.clone().add(1, 'day').format('MMM Do')})</div>
    <ul>
      <li>Write reviews of posts nominated for the 2019 Review</li>
      <li>Only posts with at least one review are eligible for the final vote</li>
    </ul>
  </div>

  const voteTooltip = <div>
    <div>Vote on posts for the 2019 Review (Opens {reviewEndDate.clone().add(1, 'day').format('MMM Do')})</div>
    <ul>
      <li>Vote on posts that were reviewed and nominated for the 2019 Review</li>
      <li>Any user registered before 2019 can vote in the review</li>
      <li>The end result will be compiled into a canonical sequence and best-of 2019 book</li>
    </ul>
    <div> Before the vote starts, you can try out the vote process on posts nominated and reviewed in 2018</div>
  </div>

  const activeRange = currentDate < nominationEndDate ? "nominations" : (
    currentDate < reviewEndDate ? "review" : (
      currentDate < voteEndDate ? "votes" : 
      null
    )
  )

  const dateFraction = (fractionDate: moment.Moment, startDate: moment.Moment, endDate: moment.Moment) => {
    if (fractionDate < startDate) return 0
    return ((fractionDate.unix() - startDate.unix())/(endDate.unix() - startDate.unix())*100).toFixed(2)
  }

  const all2019Url = "/allPosts?timeframe=yearly&after=2019-01-01&before=2020-01-01&limit=100&sortedBy=top&filter=unnominated2019"

  return (
    <SingleColumnSection>
      <SectionTitle 
        title={<LWTooltip title={overviewToolip} placement="bottom-start">
          <Link to={"/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review"}>The 2019 Review</Link>
        </LWTooltip>}
      >
        <LWTooltip title="All Posts written in 2019 are eligible to participate in the review. Click here to see all posts written in 2019.">
          <Link to={all2019Url}><SettingsButton showIcon={false} label="See All 2019 Posts"/></Link>
        </LWTooltip>
      </SectionTitle>
      <div className={classes.reviewTimeline}>
        <div className={classes.nominationBlock}>
          <Link to={"/nominations"}>
            <LWTooltip placement="bottom-start" title={nominationsTooltip} className={classNames(classes.progress, {[classes.activeProgress]: activeRange === "nominations"})}>
              <div className={classNames(classes.blockText, classes.blockLabel)}>Nominations</div>
              <div className={classes.blockText}>{nominationEndDate.format('MMM Do')}</div>
              {activeRange === "nominations" && <div className={classes.coloredProgress} style={{width: `${dateFraction(currentDate, nominationStartDate, nominationEndDate)}%`}}/>}
            </LWTooltip>
          </Link>
        </div>
        <div className={classes.reviewBlock}>  
          <Link to={"/reviews"}>    
            <LWTooltip placement="bottom-start" title={reviewTooltip} className={classNames(classes.progress, {[classes.activeProgress]: activeRange === "review"})}>
              <div className={classNames(classes.blockText, classes.blockLabel)}>Reviews</div>
              <div className={classes.blockText}>{reviewEndDate.format('MMM Do')}</div>
              {activeRange === "review" && <div className={classes.coloredProgress} style={{width: `${dateFraction(currentDate, nominationEndDate, reviewEndDate)}%`}}/>}
            </LWTooltip>
          </Link>    
        </div>
        <div className={classes.votingBlock}>
          <Link to={"/reviewVoting"}>
            <LWTooltip placement="bottom-start" title={voteTooltip} className={classNames(classes.progress, {[classes.activeProgress]: activeRange === "votes"})}>
              <div className={classNames(classes.blockText, classes.blockLabel)}>Votes</div>
              <div className={classes.blockText}>{voteEndDate.format('MMM Do')}</div>
              {activeRange === "votes" && <div className={classes.coloredProgress} style={{width: `${dateFraction(currentDate, reviewEndDate, voteEndDate)}%`}}/>}
            </LWTooltip>
          </Link>
        </div>
      </div>

      <AnalyticsContext listContext={"LessWrong 2019 Review"} capturePostItemOnMount>
        <RecommendationsList algorithm={reviewAlgorithm} />
      </AnalyticsContext>
      {currentUserCanVote(currentUser) && <div className={classes.actionButtonRow}>
        <LWTooltip title={<div>
          <div>Review posts with at least two nominations</div>
          </div>}>
          <Link to={"/reviewVoting"} className={classes.actionButtonCTA}>
            Vote on 2019 Posts
          </Link>
        </LWTooltip>
      </div>}
        {eligibleToNominate(currentUser) && 
          <LWTooltip title={<div>
              <div>View posts with at least 1 nomination</div>
              <div><em>(Posts need at least 2 nominations)</em></div>
            </div>}>
            <Link to={"/nominations"} className={classes.actionButton}>
              View Nominated Posts
            </Link>
          </LWTooltip>}
    </SingleColumnSection>
  )
}

const FrontpageReviewPhaseComponent = registerComponent('FrontpageReviewPhase', FrontpageReviewPhase, {styles});

declare global {
  interface ComponentTypes {
    FrontpageReviewPhase: typeof FrontpageReviewPhaseComponent
  }
}
