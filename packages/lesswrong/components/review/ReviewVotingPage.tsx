import React, { useState, useEffect, useCallback, useMemo } from 'react';
import sumBy from 'lodash/sumBy'
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from "underscore"
import { commentBodyStyles } from '../../themes/stylePiping';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents'
import seedrandom from '../../lib/seedrandom';
import { getCostData, getReviewPhase, REVIEW_YEAR } from '../../lib/reviewUtils';
import { annualReviewAnnouncementPostPathSetting } from '../../lib/publicSettings';
import { forumTypeSetting } from '../../lib/instanceSettings';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Card from '@material-ui/core/Card';
import { DEFAULT_QUALITATIVE_VOTE } from '../../lib/collections/reviewVotes/schema';
import { randomId } from '../../lib/random';

const isEAForum = forumTypeSetting.get() === 'EAForum'

const userVotesAreQuadraticField: keyof DbUser = "reviewVotesQuadratic2020";

const styles = (theme: ThemeType): JssStyles => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: `
      minmax(10px, 0.5fr) minmax(100px, 740px) minmax(30px, 0.5fr) minmax(300px, 740px) minmax(30px, 0.5fr)
    `,
    gridTemplateAreas: `
    "... leftColumn ... rightColumn ..."
    `,
    paddingBottom: 175,
    alignItems: "start",
    [theme.breakpoints.down('sm')]: {
      display: "block"
    }
  },
  instructions: {
    ...theme.typography.body2,
    ...commentBodyStyles(theme),
    padding: 16,
    marginBottom: 24,
    background: "white",
    boxShadow: theme.boxShadow,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  leftColumn: {
    gridArea: "leftColumn",
    position: "sticky",
    top: 72,
    height: "90vh",
    overflow: "scroll",
    paddingLeft: 24,
    paddingRight: 36,
    [theme.breakpoints.down('sm')]: {
      gridArea: "unset",
      paddingLeft: 0,
      paddingRight: 0,
      overflow: "unset",
      height: "unset",
      position: "unset"
    }
  },
  rightColumn: {
    gridArea: "rightColumn",
    [theme.breakpoints.down('sm')]: {
      gridArea: "unset"
    },
  },
  result: {
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    lineHeight: "1.3rem",
    marginBottom: 10,
    position: "relative"
  },
  votingBox: {
    maxWidth: 700
  },
  expandedInfo: {
    maxWidth: 600,
    marginBottom: 175,
  },
  widget: {
    marginBottom: 32
  },
  menu: {
    position: "sticky",
    top:0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    zIndex: theme.zIndexes.reviewVotingMenu,
    padding: theme.spacing.unit,
    background: "#ddd",
    borderBottom: "solid 1px rgba(0,0,0,.15)",
    flexWrap: "wrap"
  },
  menuIcon: {
    marginLeft: theme.spacing.unit
  },
  returnToBasicIcon: {
    transform: "rotate(180deg)",
    marginRight: theme.spacing.unit
  },
  expandedInfoWrapper: {
    position: "fixed",
    top: 100,
    overflowY: "auto",
    height: "100vh",
    paddingRight: 8
  },
  header: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 6,
  },
  postHeader: {
    ...theme.typography.display1,
    ...theme.typography.postStyle,
    marginTop: 0,
  },
  comments: {
  },
  costTotal: {
    ...theme.typography.commentStyle,
    marginLeft: 10,
    color: theme.palette.grey[600],
    marginRight: "auto",
    whiteSpace: "pre"
  },
  excessVotes: {
    color: theme.palette.error.main,
    // border: `solid 1px ${theme.palette.error.light}`,
    // paddingLeft: 12,
    // paddingRight: 12,
    // paddingTop: 6,
    // paddingBottom: 6,
    // borderRadius: 3,
    // '&:hover': {
    //   opacity: .5
    // }
  },
  message: {
    width: "100%",
    textAlign: "center",
    paddingTop: 50,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
  warning: {
    color: theme.palette.error.main
  },
  
  voteAverage: {
    cursor: 'pointer',
  },
  faqCard: {
    width: 400,
    padding: 16,
    ...commentBodyStyles(theme)
  },
  faqQuestion: {
    color: theme.palette.primary.main
  },
  postCount: {
    ...theme.typography.commentStyle,
    marginLeft: 10,
    color: theme.palette.grey[600],
    marginRight: "auto",
    whiteSpace: "pre"
  },
  reviewedCount: {
    color: theme.palette.primary.main,
    cursor: "pointer",
    marginRight: 8
  },
  sortingOptions: {
    whiteSpace: "pre",
    display: "flex",
    [theme.breakpoints.down('xs')]: {
      paddingTop: 12,
      paddingLeft: 4
    }
  },
  postsLoading: {
    opacity: .4,
  },
  sortBy: {
    color: theme.palette.grey[600],
    marginRight: 3
  },
  sortArrow: {
    cursor: "pointer",
    padding: 4,
    borderRadius: 3,
    marginRight: 6,
    border: "solid 1px rgba(0,0,0,.2)",
    "&:hover": {
      background: "rgba(0,0,0,.2)",
    }
  },
  votingTitle: {
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
  postList: {
    boxShadow: "0 1px 5px 0px rgba(0,0,0,.2)",
    background: "white",
    [theme.breakpoints.down('sm')]: {
      boxShadow: "unset"
    }
  }
});

export type SyntheticReviewVote = {postId: string, score: number, type: 'QUALITATIVE' | 'QUADRATIC'}
export type SyntheticQualitativeVote = {_id: string, postId: string, score: number, type: 'QUALITATIVE'}
export type SyntheticQuadraticVote = {postId: string, score: number, type: 'QUADRATIC'}

const generatePermutation = (count: number, user: UsersCurrent|null): Array<number> => {
  const seed = user?._id || "";
  const rng = seedrandom(seed);
  
  let remaining = _.range(count);
  let result: Array<number> = [];
  while(remaining.length > 0) {
    let idx = Math.floor(rng() * remaining.length);
    result.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return result;
}


const ReviewVotingPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking({eventType: "reviewVotingEvent"})
  

  const { results, loading: postsLoading, error: postsError } = useMulti({
    terms: {
      view: getReviewPhase() === "VOTING" ? "reviewFinalVoting" : "reviewVoting",
      before: `${REVIEW_YEAR+1}-01-01`,
      ...(isEAForum ? {} : {after: `${REVIEW_YEAR}-01-01`}),
      limit: 600,
    },
    collectionName: "Posts",
    fragmentName: 'PostsReviewVotingList',
    fetchPolicy: 'cache-and-network',
  });
  // useMulti is incorrectly typed
  const postsResults = results as PostsListWithVotes[] | null;

  const [submitVote] = useMutation(gql`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quadraticChange: Int, $newQuadraticScore: Int, $comment: String, $year: String, $dummy: Boolean) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quadraticChange: $quadraticChange, comment: $comment, newQuadraticScore: $newQuadraticScore, year: $year, dummy: $dummy) {
        ...PostsReviewVotingList
      }
    }
    ${getFragment("PostsReviewVotingList")} 
  `);

  const [sortedPosts, setSortedPosts] = useState(postsResults)
  const [loading, setLoading] = useState(false)
  const [sortReviews, setSortReviews ] = useState<string>("new")
  const [expandedPost, setExpandedPost] = useState<PostsListWithVotes|null>(null)
  const [showKarmaVotes] = useState<any>(true)
  const [postsHaveBeenSorted, setPostsHaveBeenSorted] = useState(false)

  if (postsError) {
    // eslint-disable-next-line no-console
    console.error('Error loading posts', postsError);
  }

  function getCostTotal (posts) {
    return posts?.map(post=>getCostData({})[post.currentUserReviewVote?.qualitativeScore || 0].cost).reduce((a,b)=>a+b, 0)
  }
  const [costTotal, setCostTotal] = useState<number>(getCostTotal(postsResults))

  let defaultSort = ""
  if (getReviewPhase() === "REVIEWS") { 
    defaultSort = "needsReview"
  }
  if (getReviewPhase() === "VOTING") { defaultSort = "needsFinalVote"}

  const [sortPosts, setSortPosts] = useState(defaultSort)
  const [sortReversed, setSortReversed] = useState(false)

  const dispatchQualitativeVote = useCallback(async ({_id, postId, score}: SyntheticQualitativeVote) => {
    
    const post = postsResults?.find(post => post._id === postId)
    const newPost = {
      __typename: "Post",
      ...post,
      currentUserReviewVote: {
        __typename: "ReviewVote",
        _id: _id || randomId(),
        qualitativeScore: score
      }
    }

    return await submitVote({
      variables: {postId, qualitativeScore: score, year: REVIEW_YEAR+"", dummy: false},
      optimisticResponse: {
        submitReviewVote: newPost
      }
    })
  }, [submitVote, postsResults]);

  const { LWTooltip, Loading, ReviewVotingExpandedPost, ReviewVoteTableRow, SectionTitle, RecentComments, FrontpageReviewWidget } = Components

  const canInitialResort = !!postsResults

  const reSortPosts = useCallback((sortPosts, sortReversed) => {
    if (!postsResults) return

    const randomPermutation = generatePermutation(postsResults.length, currentUser)
    const newlySortedPosts = postsResults
      .map((post, i) => ([post, randomPermutation[i]] as const))
      .sort(([inputPost1, permuted1], [inputPost2, permuted2]) => {
        const post1 = sortReversed ? inputPost2 : inputPost1
        const post2 = sortReversed ? inputPost1 : inputPost2

        const post1Score = post1.currentUserReviewVote?.qualitativeScore || 0
        const post2Score = post2.currentUserReviewVote?.qualitativeScore || 0

        if (sortPosts === "needsReview") {
          // This prioritizes posts with no reviews, which you highly upvoted
          const post1NeedsReview = post1.reviewCount === 0 && post1.reviewVoteScoreHighKarma > 4
          const post2NeedsReview = post2.reviewCount === 0 && post2.reviewVoteScoreHighKarma > 4

          const post1isCurrentUsers = post1.userId === currentUser?._id
          const post2isCurrentUsers = post2.userId === currentUser?._id

          if (post1NeedsReview && !post2NeedsReview) return -1
          if (post2NeedsReview && !post1NeedsReview) return 1
          if (post1isCurrentUsers && !post2isCurrentUsers) return -1
          if (post2isCurrentUsers && !post1isCurrentUsers) return 1
          if (post1Score > post2Score) return -1
          if (post1Score < post2Score) return 1
        }

        if (sortPosts === "needsFinalVote") {
          const post1NotReviewVoted = post1.currentUserReviewVote === null && post1.userId !== currentUser?._id
          const post2NotReviewVoted = post2.currentUserReviewVote === null && post2.userId !== currentUser?._id
          const post1NotKarmaVoted = post1.currentUserVote === null 
          const post2NotKarmaVoted = post2.currentUserVote === null
          if (post1NotReviewVoted && !post2NotReviewVoted) return -1
          if (post2NotReviewVoted && !post1NotReviewVoted) return 1
          if (post1Score < post2Score) return 1
          if (post1Score > post2Score) return -1
          if (post1NotKarmaVoted && !post2NotKarmaVoted) return 1
          if (post2NotKarmaVoted && !post1NotKarmaVoted) return -1
          if (permuted1 < permuted2) return -1;
          if (permuted1 > permuted2) return 1;
        }

        if (sortPosts === "currentUserReviewVote") {
          if (post1Score > post2Score) return -1
          if (post2Score < post1Score) return 1
        }

        if (post1[sortPosts] > post2[sortPosts]) return -1
        if (post1[sortPosts] < post2[sortPosts]) return 1

        if (post1.reviewVoteScoreHighKarma > post2.reviewVoteScoreHighKarma ) return -1
        if (post1.reviewVoteScoreHighKarma < post2.reviewVoteScoreHighKarma ) return 1

        // TODO: figure out why commenting this out makes it sort correctly.

        const reviewedNotVoted1 = post1.reviewCount > 0 && !post1Score
        const reviewedNotVoted2 = post2.reviewCount > 0 && !post2Score
        if (reviewedNotVoted1 && !reviewedNotVoted2) return -1
        if (!reviewedNotVoted1 && reviewedNotVoted2) return 1
        if (post1Score < post2Score) return 1
        if (post1Score > post2Score) return -1
        if (permuted1 < permuted2) return -1;
        if (permuted1 > permuted2) return 1;
        return 0
      })
      .map(([post, _]) => post)
    setSortedPosts(newlySortedPosts)
    setPostsHaveBeenSorted(true)
    captureEvent(undefined, {eventSubType: "postsResorted"})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, captureEvent, canInitialResort])
  
  useEffect(() => {
    setCostTotal(getCostTotal(postsResults))
  }, [canInitialResort, postsResults])

  useEffect(() => {
    reSortPosts(sortPosts, sortReversed)
  }, [canInitialResort, reSortPosts, sortPosts, sortReversed])

  const instructions = isEAForum ?
    <div className={classes.instructions}>
      <p>This is the Final Voting phase. During this phase, you'll read reviews, reconsider posts in the context of today, and cast or update your votes. At the end we'll have a final ordering of the Forum's favorite EA writings of all time.</p>
      
      <p><b>FAQ</b></p>
      
      <p className={classes.faqQuestion}>
        <LWTooltip tooltip={false} title={<Card className={classes.faqCard}>
          <p>If you intuitively sort posts into "good", "important", "crucial", etc., you'll probably do fine. But here are some details on how it works under the hood:</p>

          <p>Each of the voting buttons corresponds to a relative strength: 1x, 4x, or 9x. One of your "9" votes is 9x as powerful as one of your "1" votes. However, voting power is normalized so that everyone ends up with roughly the same amount of influence. If you mark every post you like as a "9", your "9" votes will end up weaker than those of someone who used them more sparingly. On the "backend", we use a quadratic voting system, giving you a fixed number of points and attempting to allocate them to match the relative strengths of your votes.</p>
        </Card>}>
          How exactly do the votes work?
        </LWTooltip>
      </p>

      <p className={classes.faqQuestion}>
        <LWTooltip tooltip={false} title={<Card className={classes.faqCard}>
          <p>The Review phase involves writing reviews of posts, with the advantage of hindsight. They can be brief or very detailed. You can write multiple reviews if your thoughts evolve over the course of the event.</p>
        </Card>}>
          Submitting reviews
        </LWTooltip>
      </p>
      
      <p>If you have any trouble, please <Link to="/contact">contact the Forum team</Link>, or leave a comment on <Link to={annualReviewAnnouncementPostPathSetting.get()}>this post</Link>.</p>
    </div> :
    <div className={classes.instructions}>
      {getReviewPhase() === "NOMINATIONS" && <><p>During the <em>Preliminary Voting Phase</em>, eligible users are encouraged to:</p>
      <ul>
        <li>
          Vote on posts that represent important intellectual progress.
        </li>
        <li>Write short reviews that explain why those posts seem important</li>
      </ul> 
      <p>Posts with at least one positive vote will appear on this page, to the right. Posts with at least one review are sorted to the top, to make them easier to vote on.</p>

      <p>At the end of the Preliminary Voting phase, the LessWrong team will publish a ranked list of the results. This will help inform how to spend attention during <em>the Review Phase</em>. High-ranking, undervalued or controversial posts can get additional focus.</p></>}


      {getReviewPhase() === "REVIEWS"  && <><p><b>Posts need at least 1 Review to enter the Final Voting Phase</b></p>

      <p>This is the Review Phase. Posts with one nomation will appear in the public list to the right. Please write reviews of whatever posts you have opinions about.</p>

      <p>If you wish to adjust your votes, you can sort posts into seven categories (roughly "super strong downvote" to "super strong upvote"). During the Final Voting phase, you'll have the opportunity to fine-tune those votes using our quadratic voting system; see <a href="https://lesswrong.com/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">this LessWrong post</a> for details.</p></>}

      <p><b>FAQ</b></p>

      <p className={classes.faqQuestion}>
        <LWTooltip tooltip={false} title={<Card className={classes.faqCard}>
          <p>If you intuitively sort posts into "good", "important", "crucial", you'll probably do fine. But here are some details on how it works under-the-hood:</p>
          <p>Each vote-button corresponds to a relative strength: 1x, 4x, or 9x. Your "9" votes are 9x as powerful as your "1" votes. But, voting power is normalized so that everyone ends up with roughly the same amount of influence. If you mark every post you like as a "9", your "9" votes will end up weaker than someone who used them more sparingly.</p>
          <p>On the "backend" the system uses our <Link to="/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">quadratic voting system</Link>, giving you a 500 points and allocating them to match the relative strengths of your vote-choices. A 4x vote costs 10 points, a 9x costs 45.</p>
          <p>You can change your votes during the Final Voting Phase.</p>
        </Card>}>
          How exactly do Preliminary Votes work?
        </LWTooltip>
      </p>

      <p className={classes.faqQuestion}>
        <LWTooltip tooltip={false} title={<Card className={classes.faqCard}>
          <ul>
            <li>Any user registered before {REVIEW_YEAR} can vote on posts.</li>
            <li>Votes by users with 1000+ karma will be weighted more highly by the moderation team when assembling the final sequence, books or prizes.</li>
            <li>Any user can write reviews.</li>
          </ul>
          </Card>}>
            Who is eligible?
        </LWTooltip>
      </p>
    </div>

  const reviewedPosts = sortedPosts?.filter(post=>post.reviewCount > 0)

  const costTotalTooltip = costTotal > 500 ? <div>You have spent more than 500 points. Your vote strength will be reduced to account for this.</div> : <div>You have {500 - costTotal} points remaining before your vote-weight begins to reduce.</div>

  return (
    <AnalyticsContext pageContext="ReviewVotingPage">
    <div>
      <div className={classes.grid}>
        <div className={classes.leftColumn}>
          {!expandedPost && <div>
            <div className={classes.widget}>
              <FrontpageReviewWidget showFrontpageItems={false}/>
            </div>
            {instructions}
            <SectionTitle title="Reviews">
              <Select
                value={sortReviews}
                onChange={(e)=>setSortReviews(e.target.value)}
                disableUnderline
                >
                <MenuItem value={'top'}>Sorted by Top</MenuItem>
                <MenuItem value={'new'}>Sorted by New</MenuItem>
                <MenuItem value={'groupByPost'}>Grouped by Post</MenuItem>
              </Select>
            </SectionTitle>
            <RecentComments terms={{ view: "reviews", reviewYear: REVIEW_YEAR, sortBy: sortReviews}} truncated/>
          </div>}
          <ReviewVotingExpandedPost key={expandedPost?._id} post={expandedPost}/>
        </div>
        <div className={classes.rightColumn}>
          <div className={classes.votingTitle}>Voting</div>
          <div className={classes.menu}>

            {/* TODO: Remove this if we haven't seen the error in awhile. I think I've fixed it but... model uncertainty */}
            {!postsResults && !postsLoading && <div className={classes.postCount}>ERROR: Please Refresh</div>} 

            {sortedPosts && 
              <div className={classes.postCount}>
                <LWTooltip title="Posts need at least 1 review to enter the Final Voting Phase">
                  <span className={classes.reviewedCount}>
                    {reviewedPosts?.length || 0} Reviewed Posts
                  </span>
                </LWTooltip> 
                {getReviewPhase() !== "VOTING" && <>({sortedPosts.length} Nominated)</>}
              </div>
            }
            {(postsLoading || loading) && <Loading/>}

            {!isEAForum && (costTotal !== null) && <div className={classNames(classes.costTotal, {[classes.excessVotes]: costTotal > 500})}>
              <LWTooltip title={costTotalTooltip}>
                {costTotal}/500
              </LWTooltip>
            </div>}
            
            <div className={classes.sortingOptions}>
              <LWTooltip title={`Sorted by ${sortReversed ? "Ascending" : "Descending"}`}>
                <div onClick={() => { 
                  setSortReversed(!sortReversed); 
                }}>
                  {sortReversed ? <ArrowUpwardIcon className={classes.sortArrow} />
                    : <ArrowDownwardIcon className={classes.sortArrow}  />
                  }
                </div>
              </LWTooltip>
              <Select
                value={sortPosts}
                onChange={(e)=>{setSortPosts(e.target.value)}}
                disableUnderline
                >
                <MenuItem value={'lastCommentedAt'}>
                  <span className={classes.sortBy}>Sort by</span> Last Commented
                </MenuItem>
                <MenuItem value={'reviewVoteScoreHighKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (1000+ Karma Users)
                </MenuItem>
                <MenuItem value={'reviewVoteScoreAllKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (All Users)
                </MenuItem>
                {!isEAForum && <MenuItem value={'reviewVoteScoreAF'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (Alignment Forum Users)
                </MenuItem>}
                <MenuItem value={'currentUserReviewVote'}>
                  <span className={classes.sortBy}>Sort by</span> Your Vote
                </MenuItem>
                <MenuItem value={'reviewCount'}>
                  <span className={classes.sortBy}>Sort by</span> Review Count
                </MenuItem>
                {getReviewPhase() === "REVIEWS" && 
                  <MenuItem value={'needsReview'}>
                    <span className={classes.sortBy}>Sort by</span> Needs Review
                  </MenuItem>}
                {getReviewPhase() === "VOTING" && 
                  <MenuItem value={'needsFinalVote'}>
                    <span className={classes.sortBy}>Sort by</span> Needs Vote
                  </MenuItem>}
              </Select>
            </div>
          </div>
          <div className={classNames({[classes.postList]: getReviewPhase() !== "VOTING", [classes.postLoading]: postsLoading || loading})}>
            {postsHaveBeenSorted && sortedPosts?.map((post) => {
              const currentVote = post.currentUserReviewVote !== null ? {
                _id: post.currentUserReviewVote._id,
                postId: post._id,
                score: post.currentUserReviewVote.qualitativeScore,
                type: "QUALITATIVE" as const
              } : null
              return <div key={post._id} onClick={()=>{
                setExpandedPost(post)
                captureEvent(undefined, {eventSubType: "voteTableRowClicked", postId: post._id})}}
              >
                <ReviewVoteTableRow
                  post={post}
                  costTotal={costTotal}
                  showKarmaVotes={showKarmaVotes}
                  dispatch={dispatchQualitativeVote}
                  currentVote={currentVote}
                  expandedPostId={expandedPost?._id}
                />
              </div>
            })}
          </div>
        </div>
      </div>
    </div>
    </AnalyticsContext>
  );
}

const ReviewVotingPageComponent = registerComponent('ReviewVotingPage', ReviewVotingPage, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingPage: typeof ReviewVotingPageComponent
  }
}
