import React, { useState, useEffect, useCallback } from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from "underscore"
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents'
import seedrandom from '../../lib/seedrandom';
import { eligibleToNominate, getCostData, getReviewPhase, ReviewPhase, getReviewYearFromString } from '../../lib/reviewUtils';
import { forumTypeSetting } from '../../lib/instanceSettings';
import Select from '@material-ui/core/Select';
import { randomId } from '../../lib/random';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { voteTooltipType } from './ReviewVoteTableRow';
import qs from 'qs';
import { Link } from '../../lib/reactRouterWrapper';
import filter from 'lodash/filter';
import { fieldIn } from '../../lib/utils/typeGuardUtils';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

const isEAForum = forumTypeSetting.get() === 'EAForum'
const isLW = forumTypeSetting.get() === 'LessWrong'
const isAF = forumTypeSetting.get() === 'AlignmentForum'

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
    padding: 16,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.default,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  leftColumn: {
    gridArea: "leftColumn",
    position: "sticky",
    top: 72,
    height: "90vh",
    paddingLeft: 24,
    paddingRight: 36,
    overflow: "scroll",
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
  menu: {
    position: "sticky",
    top:0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.panelBackground.default,
    zIndex: theme.zIndexes.reviewVotingMenu,
    padding: theme.spacing.unit,
    background: theme.palette.grey[310],
    borderBottom: theme.palette.border.slightlyFaint,
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
  singleLineWarning: {
    padding: 16,
  },
  
  voteAverage: {
    cursor: 'pointer',
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
    border: theme.palette.border.normal,
    "&:hover": {
      background: theme.palette.panelBackground.darken20,
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
    boxShadow: `0 1px 5px 0px ${theme.palette.boxShadowColor(0.2)}`,
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down('sm')]: {
      boxShadow: "unset"
    }
  },
});

export type SyntheticReviewVote = {postId: string, score: number, type: 'QUALITATIVE' | 'QUADRATIC'}
export type SyntheticQualitativeVote = {_id: string, postId: string, score: number, type: 'QUALITATIVE'}
export type SyntheticQuadraticVote = {postId: string, score: number, type: 'QUADRATIC'}

export const generatePermutation = (count: number, user: UsersCurrent|null): Array<number> => {
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
  classes: ClassesType
}) => {
  const { LWTooltip, Loading, ReviewVotingExpandedPost, ReviewVoteTableRow, FrontpageReviewWidget, SingleColumnSection, ReviewPhaseInformation, ReviewDashboardButtons, ContentStyles, MenuItem, PostsTagsList } = Components

  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking({eventType: "reviewVotingEvent"})
  const { params, query } = useLocation()
  const reviewYear = getReviewYearFromString(params.year)


  let reviewPhase = getReviewPhase(reviewYear)
  if (query.phase) {
    reviewPhase = query.phase as ReviewPhase
  }

  const { results, loading: postsLoading, error: postsError } = useMulti({
    terms: {
      view: reviewPhase === "VOTING" ? "reviewFinalVoting" : "reviewVoting",
      before: `${reviewYear+1}-01-01`,
      reviewPhase: reviewPhase,
      ...(isEAForum ? {} : {after: `${reviewYear}-01-01`}),
      limit: 600,
    },
    collectionName: "Posts",
    fragmentName: 'PostsReviewVotingList',
    fetchPolicy: 'cache-and-network',
    skip: !reviewYear
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
  const [tagFilter, setTagFilter] = useState<string|null>(null)
  const [expandedPost, setExpandedPost] = useState<PostsListWithVotes|null>(null)
  const [showKarmaVotes] = useState<any>(true)
  const [postsHaveBeenSorted, setPostsHaveBeenSorted] = useState(false)

  const handleTagFilter = (tagId: string) => {
    if (tagFilter === tagId) { 
      setTagFilter(null)
    } else {
      setTagFilter(tagId)
    }
  }

  const { history } = useNavigation();
  const location = useLocation();

  if (postsError) {
    // eslint-disable-next-line no-console
    console.error('Error loading posts', postsError);
  }

  function getCostTotal (posts: PostsListWithVotes[] | null) {
    return posts?.map(post=>getCostData({})[post.currentUserReviewVote?.qualitativeScore || 0].cost).reduce((a,b)=>a+b, 0) ?? 0
  }
  const [costTotal, setCostTotal] = useState<number>(getCostTotal(postsResults))

  let defaultSort = ""
  switch (reviewPhase) {
    case 'NOMINATIONS':
      defaultSort = "needsPreliminaryVote";
      break;
    case 'REVIEWS':
      defaultSort = "needsReview"
      break;
    case 'VOTING':
      defaultSort = "needsFinalVote";
      break;
    case 'COMPLETE':
      defaultSort = 'finalReviewVoteScoreHighKarma';
      break;
    default:
      defaultSort = "reviewCount";
      break;
  }

  const querySort = location.query.sort
  const [sortPosts, setSortPosts] = useState(querySort ?? defaultSort)
  const [sortReversed, setSortReversed] = useState(false)

  const updatePostSort = (sort: AnyBecauseTodo) => {
    setSortPosts(sort)
    const newQuery = {...location.query, sort}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  }

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
      variables: {postId, qualitativeScore: score, year: reviewYear+"", dummy: false},
      optimisticResponse: {
        submitReviewVote: newPost
      }
    })
  }, [submitVote, postsResults, reviewYear]);

  const canInitialResort = !!postsResults

  const reSortPosts = useCallback((sortPosts: string, sortReversed: boolean, tagFilter: string|null) => {
    if (!postsResults) return

    const randomPermutation = generatePermutation(postsResults.length, currentUser)
    const newlySortedPosts = postsResults
      .map((post, i) => ([post, randomPermutation[i]] as const))
      .sort(([inputPost1, permuted1], [inputPost2, permuted2]) => {
        const post1 = sortReversed ? inputPost2 : inputPost1
        const post2 = sortReversed ? inputPost1 : inputPost2

        const post1Score = post1.currentUserReviewVote?.qualitativeScore || 0
        const post2Score = post2.currentUserReviewVote?.qualitativeScore || 0
        const post1QuadraticScore = post1.currentUserReviewVote?.quadraticScore || 0
        const post2QuadraticScore = post2.currentUserReviewVote?.quadraticScore || 0
        const post1NotKarmaVoted = post1.currentUserVote === null 
        const post2NotKarmaVoted = post2.currentUserVote === null

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
          if (post1NotReviewVoted && !post2NotReviewVoted) return -1
          if (post2NotReviewVoted && !post1NotReviewVoted) return 1
          if (post1Score < post2Score) return 1
          if (post1Score > post2Score) return -1
          if (post1NotKarmaVoted && !post2NotKarmaVoted) return 1
          if (post2NotKarmaVoted && !post1NotKarmaVoted) return -1
          if (permuted1 < permuted2) return -1;
          if (permuted1 > permuted2) return 1;
        }

        if (sortPosts === "yourVote") {
          if (post1QuadraticScore || post2QuadraticScore) {
            if (post1QuadraticScore < post2QuadraticScore) return 1
            if (post1QuadraticScore > post2QuadraticScore) return -1   
          }

          if (post1Score < post2Score) return 1
          if (post1Score > post2Score) return -1
        }
        if (sortPosts === "yourKarmaVote") {
          if (post1NotKarmaVoted && !post2NotKarmaVoted) return 1
          if (post2NotKarmaVoted && !post1NotKarmaVoted) return -1
        }        

        if (fieldIn(sortPosts, post1, post2) && post1[sortPosts] > post2[sortPosts]) return -1
        if (fieldIn(sortPosts, post1, post2) && post1[sortPosts] < post2[sortPosts]) return 1

        if (post1.reviewVoteScoreHighKarma > post2.reviewVoteScoreHighKarma ) return -1
        if (post1.reviewVoteScoreHighKarma < post2.reviewVoteScoreHighKarma ) return 1

        if (sortPosts === "needsPreliminaryVote") {
          // This is intended to prioritize showing users posts which have reviews but that the current user hasn't yet voted on
          const reviewedNotVoted1 = post1.reviewCount > 0 && !post1Score
          const reviewedNotVoted2 = post2.reviewCount > 0 && !post2Score
          if (reviewedNotVoted1 && !reviewedNotVoted2) return -1
          if (!reviewedNotVoted1 && reviewedNotVoted2) return 1
        }

        if (post1Score < post2Score) return 1
        if (post1Score > post2Score) return -1
        if (permuted1 < permuted2) return -1;
        if (permuted1 > permuted2) return 1;
        return 0
      })
      .map(([post, _]) => post)
      
      const filteredPosts = tagFilter ? filter(newlySortedPosts, post => post.tags.map(tag=>tag._id).includes(tagFilter)) : newlySortedPosts


    setSortedPosts(filteredPosts)
    setPostsHaveBeenSorted(true)
    captureEvent(undefined, {eventSubType: "postsResorted"})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, captureEvent, canInitialResort])
  
  useEffect(() => {
    setCostTotal(getCostTotal(postsResults))
  }, [canInitialResort, postsResults])

  useEffect(() => {
    reSortPosts(sortPosts, sortReversed, tagFilter)
  }, [canInitialResort, reSortPosts, sortPosts, sortReversed, tagFilter])

  const reviewedPosts = sortedPosts?.filter(post=>post.reviewCount > 0)

  const costTotalTooltip = costTotal > 500 ? <div>You have spent more than 500 points. Your vote strength will be reduced to account for this.</div> : <div>You have {500 - costTotal} points remaining before your vote-weight begins to reduce.</div>

  if (!reviewYear) return <SingleColumnSection>
  {params.year} is not a valid review year.
  </SingleColumnSection>

  let voteTooltip = isAF ? "Showing votes from Alignment Forum members" : "Showing votes from all LessWrong users" as voteTooltipType
  switch (sortPosts) {
    case ("reviewVoteScoreHighKarma"):
      voteTooltip = "Showing votes by 1000+ Karma LessWrong users";
      break;
    case ("reviewVoteScoreAF"):
      voteTooltip = "Showing votes from Alignment Forum members"
      break;
  }

  const accountSettings = preferredHeadingCase("Account Settings");

  return (
    <AnalyticsContext pageContext="ReviewVotingPage">
    <div>
      <div className={classes.grid}>
        <div className={classes.leftColumn}>
          {!expandedPost && <>
            <FrontpageReviewWidget showFrontpageItems={false} reviewYear={reviewYear}/>
            <ReviewPhaseInformation reviewYear={reviewYear} reviewPhase={reviewPhase}/>
            <ReviewDashboardButtons 
              reviewYear={reviewYear} 
              reviewPhase={reviewPhase}
              showQuickReview={reviewPhase === "REVIEWS"}
            />
          </>}
         <ReviewVotingExpandedPost key={expandedPost?._id} post={expandedPost} setExpandedPost={setExpandedPost}/> 
        </div>
        <div className={classes.rightColumn}>
          {reviewPhase === "VOTING" && currentUser?.noSingleLineComments && <ContentStyles contentType="comment" className={classes.singleLineWarning}>
            <span className={classes.warning}>You have "Do not collapse comments to single line" enabled, </span>which is going to make this page pretty bloated. The intended experience is for each post to have a few truncated reviews, which you can expand. You may want to disable the option in your <Link to={'/account'}>{accountSettings}</Link>
            </ContentStyles>}
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
                {reviewPhase !== "VOTING" && <>({sortedPosts.length} Nominated)</>}
              </div>
            }
            {(postsLoading || loading) && <Loading/>}

            {!isEAForum && eligibleToNominate(currentUser) && (costTotal !== null) && <div className={classNames(classes.costTotal, {[classes.excessVotes]: costTotal > 500})}>
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
                onChange={(e)=>{updatePostSort(e.target.value)}}
                disableUnderline
                >
                {reviewPhase === "NOMINATIONS" && <MenuItem value={'needsPreliminaryVote'}>
                  <LWTooltip placement="left" title={<div>Prioritizes posts with at least one review, which you haven't yet voted on<div><em>(intended to reward reviews by making reviewed posts more prominent</em></div></div>}>
                    <span><span className={classes.sortBy}>Sort by</span> Magic (Prioritize reviewed)</span>
                  </LWTooltip>
                </MenuItem>}
                <MenuItem value={'lastCommentedAt'}>
                  <span className={classes.sortBy}>Sort by</span> {preferredHeadingCase("Last Commented")}
                </MenuItem>
                {reviewPhase === "REVIEWS" && <MenuItem value={'reviewVoteScoreHighKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (1000+ Karma Users)
                </MenuItem>}
                {reviewPhase === "REVIEWS" && <MenuItem value={'reviewVoteScoreAllKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (All Users)
                </MenuItem>}
                {reviewPhase === "REVIEWS" && (isLW || isAF) && <MenuItem value={'reviewVoteScoreAF'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (Alignment Forum Users)
                </MenuItem>}
                <MenuItem value={'yourVote'}>
                  <span className={classes.sortBy}>Sort by</span> Your Review Vote
                </MenuItem>
                <MenuItem value={'yourKarmaVote'}>
                  <span className={classes.sortBy}>Sort by</span> Your Karma Vote
                </MenuItem>
                <MenuItem value={'reviewCount'}>
                  <span className={classes.sortBy}>Sort by</span> Review Count
                </MenuItem>
                {reviewPhase === "NOMINATIONS" && 
                  <MenuItem value={'positiveReviewVoteCount'}>
                    <LWTooltip title={<div>
                      <div>Sort by how many positive votes the post has</div>
                      <div><em>(Posts need at least 2 positive votes to proceed to the Review Phase</em></div>
                    </div>}>
                      <span className={classes.sortBy}>Sort by</span> Positive Vote Count
                    </LWTooltip>
                  </MenuItem>
                }
                {reviewPhase === "REVIEWS" && 
                  <MenuItem value={'needsReview'}>
                    <LWTooltip title={<div><p>Prioritizes posts you voted on or wrote, which haven't had a review written, and which have at least 4 points.</p>
                      <p><em>(i.e. emphasizees posts that you'd likely want to prioritize reviewing, so that they make it to the final voting)</em></p>
                    </div>}>
                      <span><span className={classes.sortBy}>Sort by</span> Magic (Needs Review)</span>
                    </LWTooltip>
                  </MenuItem>
                }
                {reviewPhase === "VOTING" && 
                  <MenuItem value={'needsFinalVote'}>
                    <LWTooltip title={<div>Prioritizes posts you haven't voted on yet</div>}>
                      <span><span className={classes.sortBy}>Sort by</span> Magic (Needs Vote)</span>
                    </LWTooltip>
                  </MenuItem>
                }
                {reviewPhase === "COMPLETE" && <MenuItem value={'finalReviewVoteScoreHighKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Final Vote Total (1000+ Karma Users)
                </MenuItem>}
                {reviewPhase === "COMPLETE" && <MenuItem value={'finalReviewVoteScoreAllKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Final Vote Total (All Users)
                </MenuItem>}
                {reviewPhase === "COMPLETE" && isLW && <MenuItem value={'finalReviewVoteScoreAF'}>
                  <span className={classes.sortBy}>Sort by</span> Final Vote Total (Alignment Forum Users)
                </MenuItem>}
              </Select>
            </div>
          </div>
          <PostsTagsList 
            posts={postsResults}
            currentFilter={tagFilter} 
            handleFilter={(tagId) => handleTagFilter(tagId)}
          />

          <div className={classNames({[classes.postList]: reviewPhase !== "VOTING", [classes.postLoading]: postsLoading || loading})}>
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
                  reviewPhase={reviewPhase}
                  reviewYear={reviewYear}
                  voteTooltip={voteTooltip}
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
