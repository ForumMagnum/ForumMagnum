import React, { useState, useEffect, useCallback } from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from "underscore"
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents'
import seedrandom from '../../lib/seedrandom';
import { getCostData, getReviewPhase, ReviewPhase, getReviewYearFromString } from '../../lib/reviewUtils';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { randomId } from '../../lib/random';
import { useLocation } from '../../lib/routeUtil';
import { voteTooltipType } from './ReviewVoteTableRow';
import filter from 'lodash/filter';
import { fieldIn } from '../../lib/utils/typeGuardUtils';
import { getVotePower } from '../../lib/voting/vote';
import {tagStyle} from '@/components/tagging/FooterTag.tsx'

const isEAForum = forumTypeSetting.get() === 'EAForum'
const isLW = forumTypeSetting.get() === 'LessWrong'
const isAF = forumTypeSetting.get() === 'AlignmentForum'

const styles = (theme: ThemeType) => ({
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
  leftColumn: {
    gridArea: "leftColumn",
    position: "sticky",
    top: 72,
    height: "90vh",
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
  postsLoading: {
    opacity: .4,
  },
  postList: {
    boxShadow: `0 1px 5px 0px ${theme.palette.boxShadowColor(0.2)}`,
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down('sm')]: {
      boxShadow: "unset"
    }
  },
  statusFilter: {
    ...tagStyle(theme),
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    marginTop: 2,
    marginBottom: 2,
  },
  filterSelected: {
    backgroundColor: theme.palette.grey[700],
    color: theme.palette.background.pageActiveAreaBackground
  },
  separator: {
    color: theme.palette.grey[400],
    marginLeft: 5,
    marginRight: 5,
  }
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
  classes: ClassesType<typeof styles>
}) => {
  const {
    ReviewVotingExpandedPost,
    ReviewVoteTableRow,
    FrontpageReviewWidget,
    SingleColumnSection,
    ReviewPhaseInformation,
    ReviewDashboardButtons,
    ReviewVotingPageMenu,
    PostsTagsList,
    TabPicker,
    LWTooltip,
  } = Components

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
  const postsResults = results ?? null;

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
  const [statusFilter, setStatusFilter] = useState<string|null>('read')
  const [expandedPost, setExpandedPost] = useState<PostsReviewVotingList|null>(null)
  const [showKarmaVotes] = useState<any>(true)
  const [postsHaveBeenSorted, setPostsHaveBeenSorted] = useState(false)

  const handleTagFilter = (tagId: string) => {
    if (tagFilter === tagId) { 
      setTagFilter(null)
    } else {
      setTagFilter(tagId)
    }
  }

  const handleStatusFilter = (status: string) => {
    if (statusFilter === status) {
      setStatusFilter(null)
    } else {
      setStatusFilter(status)
    }
  }

  const location = useLocation();

  if (postsError) {
    // eslint-disable-next-line no-console
    console.error('Error loading posts', postsError);
  }

  function getCostTotal (posts: PostsReviewVotingList[] | null) {
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
        const post1KarmaVote = post1.currentUserVote
          ? getVotePower({ user: currentUser!, voteType: post1.currentUserVote, document: post1 })
          : 0;
        const post2KarmaVote = post2.currentUserVote
          ? getVotePower({ user: currentUser!, voteType: post2.currentUserVote, document: post2 })
          : 0;
        const post1Read = !!post1.lastVisitedAt
        const post2Read = !!post2.lastVisitedAt
        const post1NotKarmaVoted = post1KarmaVote === 0;
        const post2NotKarmaVoted = post2KarmaVote === 0;

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
          // Sort order is (strong-upvoted, upvoted, downvoted, strong-downvoted,
          // neutral), ie: first sort by _whether_ you karma voted, then sort by
          // _what_ you karma voted.
          if (post1NotKarmaVoted && !post2NotKarmaVoted) return 1
          if (post2NotKarmaVoted && !post1NotKarmaVoted) return -1
          if (post1KarmaVote < post2KarmaVote) return 1;
          if (post1KarmaVote > post2KarmaVote) return -1;
          if (post1Read && !post2Read) return -1
          if (post2Read && !post1Read) return 1
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
        if (post1NotKarmaVoted && !post2NotKarmaVoted) return 1
        if (post2NotKarmaVoted && !post1NotKarmaVoted) return -1
        if (post1KarmaVote < post2KarmaVote) return 1;
        if (post1KarmaVote > post2KarmaVote) return -1;
        if (post1Read && !post2Read) return -1
        if (post2Read && !post1Read) return 1
        if (permuted1 < permuted2) return -1;
        if (permuted1 > permuted2) return 1;
        return 0
      })
      .map(([post, _]) => post)

    const tagFilteredPosts = tagFilter ? filter(newlySortedPosts, post => post.tags.map(tag => tag._id).includes(tagFilter)) : newlySortedPosts
    const filteredPosts = filter(tagFilteredPosts, post => statusFilter === 'read' ? post.lastVisitedAt !== null : true);

    setSortedPosts(filteredPosts)
    setPostsHaveBeenSorted(true)
    captureEvent(undefined, {eventSubType: "postsResorted"})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, captureEvent, canInitialResort, statusFilter])
  
  useEffect(() => {
    setCostTotal(getCostTotal(postsResults))
  }, [canInitialResort, postsResults])

  useEffect(() => {
    reSortPosts(sortPosts, sortReversed, tagFilter)
  }, [canInitialResort, reSortPosts, sortPosts, sortReversed, tagFilter, statusFilter])

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

  if (!currentUser) {
    return <SingleColumnSection>
      You must be logged in to vote in the LessWrong Review.
    </SingleColumnSection>
  }

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
          <ReviewVotingPageMenu reviewPhase={reviewPhase} loading={loading} sortedPosts={sortedPosts} costTotal={costTotal} setSortPosts={setSortPosts} sortPosts={sortPosts} sortReversed={sortReversed} setSortReversed={setSortReversed} postsLoading={postsLoading} postsResults={postsResults} />


          <PostsTagsList
            posts={postsResults}
            currentFilter={tagFilter}
            handleFilter={(tagId) => handleTagFilter(tagId)}
            defaultMax={5}
            beforeChildren={<>
              <LWTooltip title="Only show the post you've read">
                <div className={classNames(classes.statusFilter, {[classes.filterSelected]: statusFilter === 'read'})}
                     onClick={() => handleStatusFilter('read')}>
                  Read
                </div>
              </LWTooltip>

              <span className={classes.separator}>{' '}•{' '}</span>
            </>}
          />

          <div className={classNames({[classes.postList]: reviewPhase !== "VOTING", [classes.postsLoading]: postsLoading || loading})}>
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
