import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import classNames from 'classnames';
import { forumTitleSetting, forumTypeSetting, siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { annualReviewAnnouncementPostPathSetting, annualReviewEnd, annualReviewNominationPhaseEnd, annualReviewReviewPhaseEnd, annualReviewStart } from '../../lib/publicSettings';
import moment from 'moment';
import { eligibleToNominate, getReviewPhase, getReviewTitle, ReviewYear, REVIEW_NAME_IN_SITU, REVIEW_YEAR } from '../../lib/reviewUtils';

const isEAForum = forumTypeSetting.get() === "EAForum"

const styles = (theme: ThemeType): JssStyles => ({
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
    color: theme.palette.text.invertedBackgroundText,
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
    backgroundColor: theme.palette.greyAlpha(.14),
    display: 'flex',
    justifyContent: 'space-between',
    '&:hover': {
      boxShadow: `0px 0px 10px ${theme.palette.boxShadowColor(0.1)}`,
      opacity: 0.9
    }
  },
  activeProgress: {
    backgroundColor: isEAForum ? theme.palette.primary.main : theme.palette.review.activeProgress,
  },
  coloredProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: isEAForum ? theme.palette.lwTertiary.main : theme.palette.review.progressBar,
  },
  nominationDate: {},
  actionButtonRow: {
    textAlign: "right",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionButtonCTA: {
    backgroundColor: theme.palette.primary.main,
    border: `solid 1px ${theme.palette.primary.main}`,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 3,
    color: theme.palette.text.invertedBackgroundText,
    ...theme.typography.commentStyle,
    display: "inline-block",
    marginLeft: 10
  },
  actionButtonCTA2: {
    backgroundColor: theme.palette.panelBackground.default,
    border: `solid 2px ${theme.palette.primary.light}`,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 3,
    color: theme.palette.primary.dark,
    ...theme.typography.commentStyle,
    display: "inline-block",
    marginLeft: 10
  },
  actionButton: {
    border: `solid 1px ${theme.palette.grey[400]}`,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 3,
    color: theme.palette.grey[600],
    ...theme.typography.commentStyle,
    display: "inline-block",
    marginLeft: 10
  },
  adminButton: {
    border: `solid 1px ${theme.palette.review.adminButton}`,
    color: theme.palette.review.adminButton,
  },
  buttonWrapper: {
    flexGrow: 0,
    flexShrink: 0
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  showOnMobile: {
    [theme.breakpoints.up('md')]: {
      display: 'none'
    }
  },
  timeRemaining: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.grey[500],
    marginLeft: 12
  },
  nominationTimeRemaining: {
    marginRight: "auto",
    marginLeft: 4,
    textAlign: "left"
  },
  reviewProgressBar: {
    marginRight: 2,
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  }
})

function isLastDay(date: moment.Moment) {
  return date.diff(new Date()) < (24 * 60 * 60 * 1000)
}

/**
 * Get the algorithm for review recommendations
 *
 * Needs to be a function so it gets rerun after a potential database setting
 * update that changes the review phase
 */
export function getReviewAlgorithm(): RecommendationsAlgorithm {
  const reviewPhase = getReviewPhase() || "NOMINATIONS"
  
  // Not sure why the type assertion at the end is necessary
  const reviewPhaseInfo = ({
    NOMINATIONS: {reviewNominations: REVIEW_YEAR},
    REVIEWS: {reviewReviews: REVIEW_YEAR},
    VOTING: {reviewReviews: REVIEW_YEAR},
  } as AnyBecauseTodo)[reviewPhase] as {reviewNominations: ReviewYear} | {reviewReviews: ReviewYear}
  return {
    method: "sample",
    count: 3,
    scoreOffset: 0,
    scoreExponent: 0,
    personalBlogpostModifier: 0,
    frontpageModifier: 0,
    curatedModifier: 0,
    includePersonal: true,
    includeMeta: true,
    ...reviewPhaseInfo,
    onlyUnread: false,
    excludeDefaultRecommendations: true
  }
}

  
const nominationStartDate = moment.utc(annualReviewStart.get())
const nominationEndDate = moment.utc(annualReviewNominationPhaseEnd.get())
const reviewEndDate = moment.utc(annualReviewReviewPhaseEnd.get())
const voteEndDate = moment.utc(annualReviewEnd.get())

const forumTitle = forumTitleSetting.get()

const nominationPhaseDateRange = <span>{nominationStartDate.format('MMM Do')} – {nominationEndDate.format('MMM Do')}</span>
const reviewPhaseDateRange = <span>{nominationEndDate.clone().format('MMM Do')} – {reviewEndDate.format('MMM Do')}</span>
const votingPhaseDateRange = <span>{reviewEndDate.clone().format('MMM Do')} – {voteEndDate.format('MMM Do')}</span>

// EA will use LW text next year, so I've kept the forumType genericization
export const overviewTooltip = isEAForum ?
  <div>
    <div>The EA Forum is reflecting on the best EA writing, in three phases</div>
    <ul>
      <li><em>Nomination</em> ({nominationPhaseDateRange})</li>
      <li><em>Review</em> ({reviewPhaseDateRange})</li>
      <li><em>Voting</em> ({votingPhaseDateRange})</li>
    </ul>
    <div>To be eligible, posts must have been posted before January 1st, 2021.</div>
    <br/>
    {/* TODO:(Review) this won't be true in other phases */}
    <div>(Currently this section shows a random sample of eligible posts, weighted by karma)</div>
  </div> :
  <div>
    <div>The {forumTitle} community is reflecting on the best posts from {REVIEW_YEAR}, in three phases:</div>
    <ul>
      <li><em>Nomination Voting</em> ({nominationPhaseDateRange})</li>
      <li><em>Review</em> ({reviewPhaseDateRange})</li>
      <li><em>Final Voting</em> ({votingPhaseDateRange})</li>
    </ul>
    <div>The {forumTitle} moderation team will incorporate that information, along with their judgment, into a "Best of {REVIEW_YEAR}" sequence.</div>
    <p>We're currently in the nomination voting phase. Nominate posts by casting a nomination vote, or vote on existing nominations to help us prioritize them during the Review Phase.</p>
  </div>

const FrontpageReviewWidget = ({classes, showFrontpageItems=true, reviewYear}: {classes: ClassesType, showFrontpageItems?: boolean, reviewYear: ReviewYear}) => {
  const { SectionTitle, SettingsButton, LWTooltip, LatestReview, PostsList2, UserReviewsProgressBar, ReviewVotingProgressBar, FrontpageBestOfLWWidget } = Components
  const currentUser = useCurrentUser();

  // These should be calculated at render
  const currentDate = moment.utc()
  const activeRange = getReviewPhase(reviewYear)

  const nominationsTooltip = isEAForum ?
    <div>
      <div>Nominate posts for the {REVIEW_NAME_IN_SITU}</div>
      <ul>
        <li>Any post from before 2021 can be nominated</li>
        <li>Any user registered before the start of the review can nominate posts</li>
        <li>Posts with at least one positive vote proceed to the Review Phase.</li>
      </ul>
      <div>If you've been actively reading {siteNameWithArticleSetting.get()} before now, but didn't register an account, reach out to us on intercom.</div>
      {activeRange === "NOMINATIONS" && <div><em>{nominationEndDate.fromNow()} remaining</em></div>}
    </div> :
    <div>
      <div>Cast initial votes for the {reviewYear} Review.</div>
      <ul>
        <li>Nominate a post by casting a <em>nomination vote</em>. Or, vote on an existing nominated post to help us prioritize it during the Review Phase.</li>
        <li>Any post from {reviewYear} can be nominated</li>
        <li>Any user registered before {reviewYear} can nominate posts for review</li>
        <li>Posts will need at least two positive votes to proceed to the Review Phase.</li>
      </ul>
      {activeRange === "NOMINATIONS" && <div><em>{nominationEndDate.fromNow()} remaining</em></div>}
    </div>

  const reviewTooltip = isEAForum ?
    <>
      <div>Review posts for the {REVIEW_NAME_IN_SITU} (Opens {nominationEndDate.clone().format('MMM Do')})</div>
      <ul>
        <li>Write reviews of posts nominated for the {REVIEW_NAME_IN_SITU}</li>
        <li>Only posts with at least one review are eligible for the final vote</li>
      </ul>
      {activeRange === "REVIEWS" && <div><em>{reviewEndDate.fromNow()} remaining</em></div>}
    </> :
    <>
      <div>Review posts for the {reviewYear} Review (Opens {nominationEndDate.clone().format('MMM Do')})</div>
      <ul>
        <li>Write reviews of posts nominated for the {reviewYear} Review</li>
        <li>Only posts with at least one review are eligible for the final vote</li>
      </ul>
      {activeRange === "REVIEWS" && <div><em>{reviewEndDate.fromNow()} remaining</em></div>}
    </>

  const voteTooltip = isEAForum ?
    <>
      <div>Cast your final votes for the {REVIEW_NAME_IN_SITU}. (Opens {reviewEndDate.clone().format('MMM Do')})</div>
      <ul>
        <li>Look over nominated posts and vote on them</li>
        <li>Any user registered before {nominationStartDate.format('MMM Do')} can vote in the review</li>
      </ul>
      {activeRange === "REVIEWS" && <div><em>{voteEndDate.fromNow()} remaining</em></div>}
    </> :
    <>
      <div>Cast your final votes for the {reviewYear} Review. (Opens {reviewEndDate.clone().format('MMM Do')})</div>
      <ul>
        <li>Look over nominated posts and vote on them</li>
        <li>Any user registered before {reviewYear} can vote in the review</li>
        <li>The end result will be compiled into a canonical sequence and best-of {reviewYear} book</li>
      </ul>
      {activeRange === "REVIEWS" && <div><em>{voteEndDate.fromNow()} remaining</em></div>}
    </>

  const dateFraction = (fractionDate: moment.Moment, startDate: moment.Moment, endDate: moment.Moment) => {
    if (fractionDate < startDate) return 0
    return ((fractionDate.unix() - startDate.unix())/(endDate.unix() - startDate.unix())*100).toFixed(2)
  }

  const allEligiblePostsUrl = 
    isEAForum ? `/allPosts?timeframe=yearly&before=${reviewYear+1}-01-01&limit=25&sortedBy=top&filter=unnominated&includeShortform=false`
    : `/allPosts?timeframe=yearly&after=${reviewYear}-01-01&before=${reviewYear+1}-01-01&limit=100&sortedBy=top&filter=unnominated&includeShortform=false`
  
  const reviewPostPath = annualReviewAnnouncementPostPathSetting.get()
  if (!reviewPostPath) {
    // eslint-disable-next-line no-console
    console.error("No review announcement post path set")
  }


  const reviewTimeline = <div className={classes.reviewTimeline}>
    <div className={classes.nominationBlock}>
      <LWTooltip placement="bottom-start" title={nominationsTooltip} className={classNames(classes.progress, {[classes.activeProgress]: activeRange === "NOMINATIONS"})}>
        <div className={classNames(classes.blockText, classes.blockLabel)}>Nomination Voting</div>
        <div className={classNames(classes.blockText, classes.hideOnMobile)}>{nominationEndDate.format('MMM Do')}</div>
        {activeRange === "NOMINATIONS" && <div
          className={classes.coloredProgress}
          style={{width: `${dateFraction(currentDate, nominationStartDate, nominationEndDate)}%`}}
        />}
      </LWTooltip>
    </div>
    <div className={classes.reviewBlock}>     
      <LWTooltip placement="bottom-start" title={reviewTooltip} className={classNames(classes.progress, {[classes.activeProgress]: activeRange === "REVIEWS"})}>
        <div className={classNames(classes.blockText, classes.blockLabel)}>Reviews</div>
        <div className={classNames(classes.blockText, classes.hideOnMobile)}>{reviewEndDate.format('MMM Do')}</div>
        {activeRange === "REVIEWS" && <div className={classes.coloredProgress} style={{width: `${dateFraction(currentDate, nominationEndDate, reviewEndDate)}%`}}/>}
      </LWTooltip>   
    </div>
    <div className={classes.votingBlock}>
      <LWTooltip placement="bottom-start" title={voteTooltip} className={classNames(classes.progress, {[classes.activeProgress]: activeRange === "VOTING"})}>
        <div className={classNames(classes.blockText, classes.blockLabel)}>Final Voting</div>
        <div className={classNames(classes.blockText, classes.hideOnMobile)}>{voteEndDate.format('MMM Do')}</div>
        {activeRange === "VOTING" && <div className={classes.coloredProgress} style={{width: `${dateFraction(currentDate, reviewEndDate, voteEndDate)}%`}}/>}
      </LWTooltip>
    </div>
  </div>

  const nominationPhaseButtons = <div className={classes.actionButtonRow}>
    {showFrontpageItems && !isLastDay(nominationEndDate) && <LatestReview/>}
    {showFrontpageItems && isLastDay(nominationEndDate) && <span className={classNames(classes.nominationTimeRemaining, classes.timeRemaining)}>
      <div>{nominationEndDate.fromNow()} remaining to cast nomination votes</div>
      <div>(posts need two votes to proceed)</div>
    </span>}
    <LWTooltip className={classes.buttonWrapper} title={`Nominate posts you previously upvoted.`}>
      <Link to={`/votesByYear/${reviewYear}`} className={classes.actionButton}>
        <span>
          <span className={classes.hideOnMobile}>Your</span> {isEAForum && '≤'}{reviewYear} Upvotes
        </span>
      </Link>
    </LWTooltip>

    <LWTooltip className={classes.buttonWrapper} title={`Nominate posts ${isEAForum ? 'in or before' : 'from'} ${reviewYear}`}>
      <Link to={allEligiblePostsUrl} className={classes.actionButton}>
        All <span className={classes.hideOnMobile}>{isEAForum ? 'Eligible' : reviewYear}</span> Posts
      </Link>
    </LWTooltip>

    {showFrontpageItems && <LWTooltip className={classes.buttonWrapper} title={<div>
      <p>Reviews Dashboard</p>
      <ul>
        <li>View all posts with at least one nomination vote.</li>
        <li>Cast additional votes, to help prioritize posts during the Review Phase.</li>
        <li>Start writing reviews.</li>
      </ul>
      </div>}>
      <Link to={"/reviewVoting"} className={classes.actionButtonCTA}>
        Vote on <span className={classes.hideOnMobile}>nominated</span> posts
      </Link>
    </LWTooltip>}
  </div>

  const reviewPhaseButtons = <div className={classes.actionButtonRow}>
    {currentUser && currentUser.karma >= 1000 && <span className={classes.reviewProgressBar}>
      <UserReviewsProgressBar reviewYear={reviewYear}/>
    </span>}
    <LWTooltip title="A list of all reviews, with the top review-commenters ranked by total karma">
      <Link to={"/reviews"} className={classes.actionButton}>
        Review Leaderboard
      </Link>
    </LWTooltip>
    <LWTooltip title="A detailed view of all nominated posts">
      <Link to={"/reviewVoting"} className={classes.actionButton}>
        Advanced Dashboard
      </Link>
    </LWTooltip>
    <LWTooltip title="Find a top unreviewed post, and review it">
      <Link to={"/reviewQuickPage"} className={classes.actionButtonCTA}>
        Quick Review
      </Link>
    </LWTooltip>
    {/* If there's less than 24 hours remaining, show the remaining time */}
    {isLastDay(reviewEndDate) && <span className={classes.timeRemaining}>
      {reviewEndDate.fromNow()} remaining
    </span>}
  </div>

  const votingPhaseButtons = <div className={classes.actionButtonRow}>
    {currentUser && currentUser.karma >= 1000 && <span className={classes.reviewProgressBar}>
      <ReviewVotingProgressBar reviewYear={REVIEW_YEAR}/>
    </span>}
    <LWTooltip title="A list of all reviews, with the top review-commenters ranked by total karma">
      <Link to={"/reviews"} className={classes.actionButton}>
        Review Leaderboard
      </Link>
    </LWTooltip>
    {
      <Link to={"/reviewVoting"} className={classes.actionButtonCTA}>
        Cast Final Votes
      </Link>
    }
    {/* If there's less than 24 hours remaining, show the remaining time */}
    {isLastDay(voteEndDate) && <span className={classes.timeRemaining}>
      {voteEndDate.fromNow()} remaining
    </span>}  
  </div>

  const postList = <AnalyticsContext listContext={`frontpageReviewReviews`} reviewYear={`${reviewYear}`}>
    <PostsList2 
      itemsPerPage={10}
      terms={{
        view:"reviewVoting",
        before: `${reviewYear+1}-01-01`,
        ...(isEAForum ? {} : {after: `${reviewYear}-01-01`}),
        limit: 3,
      }}
    >
      {activeRange === "NOMINATIONS" && showFrontpageItems && eligibleToNominate(currentUser) && nominationPhaseButtons}  

      {activeRange === "REVIEWS" && showFrontpageItems && reviewPhaseButtons}

      {activeRange === "VOTING" && showFrontpageItems && eligibleToNominate(currentUser) && votingPhaseButtons}
    </PostsList2>
  </AnalyticsContext>

  return (
    <AnalyticsContext pageSectionContext="frontpageReviewWidget">
      <div>
        <SectionTitle 
          title={<LWTooltip title={overviewTooltip} placement="bottom-start">
            <Link to={"/reviewVoting"}>
              {getReviewTitle(reviewYear)}
            </Link>
          </LWTooltip>}
        >
          <LWTooltip title={overviewTooltip} className={classes.hideOnMobile}>
            <Link to={reviewPostPath || ""}>
              <SettingsButton showIcon={false} label={`How does the ${REVIEW_NAME_IN_SITU} work?`}/>
            </Link>
          </LWTooltip>
        </SectionTitle>

        {reviewTimeline}

        {/* TODO: Improve logged out user experience */}

        {/* Post list */}
        {showFrontpageItems && postList}


      </div>
    </AnalyticsContext>
  )
}

const FrontpageReviewWidgetComponent = registerComponent('FrontpageReviewWidget', FrontpageReviewWidget, {styles});

declare global {
  interface ComponentTypes {
    FrontpageReviewWidget: typeof FrontpageReviewWidgetComponent
  }
}
