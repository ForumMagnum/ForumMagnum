import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import classNames from 'classnames';
import { forumTitleSetting } from '../../lib/instanceSettings';
import moment from 'moment';
import { eligibleToNominate, getReviewPhase, getReviewTitle, ReviewYear, REVIEW_YEAR, getResultsPhaseEnd, getNominationPhaseEnd, getReviewPhaseEnd, getReviewStart, reviewPostPath, longformReviewTagId } from '../../lib/reviewUtils';
import { allPostsParams } from './NominationsPage';
import qs from 'qs';

const commonActionButtonStyle = (theme: ThemeType) => ({
  paddingTop: 7,
  paddingBottom: 7,
  paddingLeft: 10,
  paddingRight: 10,
  borderRadius: 3,
  ...theme.typography.commentStyle,
  display: "inline-block",
  marginLeft: 10,
  [theme.breakpoints.down('xs')]: {
    marginLeft: 6,
    paddingLeft: 7,
    paddingRight: 7,
  }
})

const styles = (theme: ThemeType) => ({
  sectionTitle: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  reviewtitle: {
    fontSize: "1.5rem",
    fontVariant: "small-caps",
    fontFamily: theme.typography.postStyle.fontFamily,
    fontVariantNumeric: "normal",
    color: theme.palette.grey[600],
    marginBottom: 0,
  },
  reviewSectionTitle: {
    marginTop: -24,
    marginBottom: -2,
    [theme.breakpoints.down('xs')]: {
      marginTop: -16,
    }
  },
  reviewPhaseTitle: {
    fontSize: "3rem",
    marginTop: -4,
    marginBottom: 0
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
    backgroundColor: theme.palette.review.activeProgress,
  },
  coloredProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: theme.palette.review.progressBar,
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
    color: theme.palette.text.invertedBackgroundText,
    ...commonActionButtonStyle(theme),  
    textAlign: 'center',
  },
  actionButton: {
    border: `solid 1px ${theme.palette.grey[400]}`,
    color: theme.palette.grey[600],
    ...commonActionButtonStyle(theme),
    textAlign: 'center',
  },
  actionButtonSecondaryCTA: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
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
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
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

export function ReviewOverviewTooltip() {
  const forumTitle = forumTitleSetting.get()
  
  const nominationStartDate = getReviewStart(REVIEW_YEAR)
  const nominationEndDate = getNominationPhaseEnd(REVIEW_YEAR)
  const reviewEndDate = getReviewPhaseEnd(REVIEW_YEAR)
  const voteEndDate = getResultsPhaseEnd(REVIEW_YEAR)
  const nominationPhaseDateRange = <span>{nominationStartDate.format('MMM Do')} - {nominationEndDate.format('MMM Do')}</span>
  const reviewPhaseDateRange = <span>{nominationEndDate.format('MMM Do')} - {reviewEndDate.format('MMM Do')}</span>
  const votingPhaseDateRange = <span>{reviewEndDate.format('MMM Do')} - {voteEndDate.format('MMM Do')}</span>
  
  return <div>
    <div>The {forumTitle} community is reflecting on the best posts from {REVIEW_YEAR}, in three phases:</div>
      <ul>
        <li><em>Nomination Voting</em> ({nominationPhaseDateRange})</li>
        <li><em>Review</em> ({reviewPhaseDateRange})</li>
        <li><em>Final Voting</em> ({votingPhaseDateRange})</li>
      </ul>
      <div>The {forumTitle} moderation team will incorporate that information, along with their judgment, into a "Best of {REVIEW_YEAR}" sequence.</div>
      <p>We're currently in the nomination voting phase. Nominate posts by casting a nomination vote, or vote on existing nominations to help us prioritize them during the Review Phase.</p>
  </div>
}

const FrontpageReviewWidget = ({classes, showFrontpageItems=true, reviewYear, className}: {classes: ClassesType<typeof styles>, showFrontpageItems?: boolean, reviewYear: ReviewYear, className?: string}) => {
  const { SectionTitle, SettingsButton, LWTooltip, PostsList2, ReviewProgressReviews, ReviewProgressVoting, ReviewProgressNominations } = Components
  const currentUser = useCurrentUser();

  const nominationStartDate = getReviewStart(reviewYear)
  const nominationEndDate = getNominationPhaseEnd(reviewYear)
  const reviewEndDate = getReviewPhaseEnd(reviewYear)
  const voteEndDate = getResultsPhaseEnd(reviewYear)

  // These should be calculated at render
  const currentDate = moment.utc()
  const activeRange = getReviewPhase(reviewYear)

  const nominationsTooltip = <div>
      <div>Cast initial votes for the {reviewYear} Review.</div>
      <ul>
        <li>Nominate a post by casting a <em>nomination vote</em>. Or, vote on an existing nominated post to help us prioritize it during the Review Phase.</li>
        <li>Any post from {reviewYear} can be nominated</li>
        <li>Any user registered before {reviewYear} can nominate posts for review</li>
        <li>Posts will need at least two positive votes to proceed to the Review Phase.</li>
      </ul>
      {activeRange === "NOMINATIONS" && <div><em>{nominationEndDate.fromNow()} remaining</em></div>}
    </div>

  const reviewTooltip = <>
      <div>Review posts for the {reviewYear} Review (Opens {nominationEndDate.format('MMM Do')})</div>
      <ul>
        <li>Write reviews of posts nominated for the {reviewYear} Review</li>
        <li>Only posts with at least one review are eligible for the final vote</li>
      </ul>
      {activeRange === "REVIEWS" && <div><em>{reviewEndDate.fromNow()} remaining</em></div>}
    </>

  const voteTooltip = <>
      <div>Cast your final votes for the {reviewYear} Review. (Opens {reviewEndDate.format('MMM Do')})</div>
      <ul>
        <li>Look over nominated posts and vote on them</li>
        <li>Any user registered before {reviewYear} can vote in the review</li>
        <li>The end result will be compiled into a canonical sequence</li>
      </ul>
      {activeRange === "REVIEWS" && <div><em>{voteEndDate.fromNow()} remaining</em></div>}
    </>

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
        <div className={classNames(classes.blockText, classes.blockLabel)}>Discussion</div>
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


  const nominatePostsLink = `/nominatePosts/${reviewYear}?${qs.stringify(allPostsParams(reviewYear))}`
  const nominationPhaseButtons = <div className={classes.actionButtonRow}>
    {currentUser && currentUser.karma >= 1000 && <span className={classes.reviewProgressBar}>
      <ReviewProgressNominations reviewYear={REVIEW_YEAR}/>
    </span>}
    {showFrontpageItems && isLastDay(nominationEndDate) && <span className={classNames(classes.nominationTimeRemaining, classes.timeRemaining)}>
      <div>{nominationEndDate.fromNow()} remaining to cast nomination votes</div>
      <div>(posts need two votes to proceed)</div>
    </span>}
    <LWTooltip className={classes.buttonWrapper} title={`Look over your favorite posts from ${reviewYear}, and nominate the ones that stand the tests of time.`}>
      <Link to={nominatePostsLink} className={classes.actionButton}>
        Nominate Posts
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
      <ReviewProgressReviews reviewYear={reviewYear}/>
    </span>}
    <LWTooltip title="A detailed view of all nominated posts (sorted by Nomination Vote results)">
      <Link to={"/reviewVoting"} className={classes.actionButton}>
        Advanced Review
      </Link>
    </LWTooltip>
    <LWTooltip title="Write a detailed review, exploring nominated posts more comprehensively.">
      <Link to={`/newPost?tagId=${longformReviewTagId}`} className={classNames(classes.actionButton, classes.actionButtonSecondaryCTA)}>
        Longform Review
      </Link>
    </LWTooltip>
    <LWTooltip title="Find a top unreviewed post, and review it">
      <Link to={`/quickReview/${reviewYear}`} className={classes.actionButtonCTA}>
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
      <ReviewProgressVoting reviewYear={REVIEW_YEAR}/>
    </span>}
    <LWTooltip title="A list of all reviews, with the top review-commenters ranked by total karma">
      <Link to={"/reviews"} className={classes.actionButton}>
        Review Leaderboard
      </Link>
    </LWTooltip>
    <Link to={"/reviewVoting"} className={classes.actionButtonCTA}>
      Cast Final Votes
    </Link>
    {/* If there's less than 24 hours remaining, show the remaining time */}
    {isLastDay(voteEndDate) && <span className={classes.timeRemaining}>
      {voteEndDate.fromNow()} remaining
    </span>}  
  </div>

  const postList = <AnalyticsContext listContext={`frontpageReviewReviews`} reviewYear={`${reviewYear}`}>
    <PostsList2 
      itemsPerPage={10}
      terms={{
        view:"frontpageReviewWidget",
        reviewYear: reviewYear,
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
      <div className={className}>
        <SectionTitle rootClassName={classes.sectionTitle} titleClassName={classes.reviewSectionTitle}
          title={<LWTooltip title={<ReviewOverviewTooltip/>} placement="bottom-start">
            <Link to={"/reviewVoting"}>
              <h3 className={classes.reviewtitle}>{getReviewTitle(reviewYear)}</h3>
              <h1 className={classes.reviewPhaseTitle}>
                {activeRange === "NOMINATIONS" && "Nomination Voting"}
                {activeRange === "REVIEWS" && "Discussion Phase"}
                {activeRange === "VOTING" && "Final Voting"}
              </h1>
            </Link>
          </LWTooltip>}
        >
          {showFrontpageItems && <LWTooltip title={<ReviewOverviewTooltip/>} className={classes.hideOnMobile}>
            <Link to={reviewPostPath || ""}>
              <SettingsButton showIcon={false} label={`What is this?`}/>
            </Link>
          </LWTooltip>}
        </SectionTitle>

        {reviewTimeline}

        {/* TODO: Improve logged out user experience */}

        {/* Post list */}
        {showFrontpageItems && postList}


      </div>
    </AnalyticsContext>
  )
}

/**
 * Given a moment datetime and a date range that contains it, return the fraction of the time through
 * the range which the date is, as a string from 0 to 100. Eg
 *    `dateFraction(2000-01-01, 2000-01-03, 2000-01-10)`
 * whould be ~30.
 *
 * If the date is outside the range, clips the result, returning 0 or 100.
 */
const dateFraction = (fractionDate: moment.Moment, startDate: moment.Moment, endDate: moment.Moment) => {
  if (fractionDate < startDate) return 0
  if (startDate >= endDate) {
    // eslint-disable-next-line no-console
    console.error(`In dateFraction: start and end dates are reversed`);
  }
  const result = (
    (fractionDate.unix() - startDate.unix())
    / (endDate.unix() - startDate.unix())
  ) * 100;
  if (result > 100) {
    // eslint-disable-next-line no-console
    console.error(`Out of range in dateFraction: ${fractionDate}, ${startDate}, ${endDate}`);
    return "100";
  }
  return result.toFixed(2)
}

const FrontpageReviewWidgetComponent = registerComponent('FrontpageReviewWidget', FrontpageReviewWidget, {styles});

declare global {
  interface ComponentTypes {
    FrontpageReviewWidget: typeof FrontpageReviewWidgetComponent
  }
}
