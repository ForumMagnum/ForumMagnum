import React, { useState, useEffect, useCallback } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from "underscore"
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents'
import seedrandom from '../../lib/seedrandom';
import { getCostData, getReviewPhase, REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD, ReviewPhase, ReviewYear } from '../../lib/reviewUtils';
import { randomId } from '../../lib/random';
import { useLocation } from '../../lib/routeUtil';
import ReviewVoteTableRow, { voteTooltipType } from './ReviewVoteTableRow';
import filter from 'lodash/filter';
import { fieldIn } from '../../lib/utils/typeGuardUtils';
import { getVotePower } from '../../lib/voting/vote';
import {tagStyle} from '@/components/tagging/FooterTag.tsx'
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { Link } from '@/lib/reactRouterWrapper';
import ReviewVotingPageMenu, { sortingInfo } from './ReviewVotingPageMenu';
import { useCommentBox } from '../hooks/useCommentBox';
import { useDialog } from '../common/withDialog';
import { registerComponent } from "../../lib/vulcan-lib/components";
import ReviewPostForm from "./ReviewPostForm";
import PostsTagsList from "../tagging/PostsTagsList";
import LWTooltip from "../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  votingPageContainer: {
    width: "100%",
    maxWidth: SECTION_WIDTH,
    backgroundColor: theme.palette.background.translucentBackground,
  },
  postsLoading: {
    opacity: .4,
  },
  postList: {
    boxShadow: `0 1px 5px 0px ${theme.palette.boxShadowColor(0.2)}`,
    width: "100%",
    maxWidth: SECTION_WIDTH,
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down('sm')]: {
      boxShadow: "unset"
    }
  },
  statusFilter: {
    ...tagStyle(theme),
    paddingRight: 10,
    paddingLeft: 8,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    marginTop: 2,
    marginBottom: 2,
  },
  filterSelected: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.background.pageActiveAreaBackground
  },
  separator: {
    color: theme.palette.grey[400],
    marginLeft: 5,
    marginRight: 5,
  },
  tagListContainer: {
    padding: 16
  },
  votingPageHeader: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    ...theme.typography.body2,
    '& a': {
      color: theme.palette.primary.main,
    }
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

const ReviewVotingPage = ({classes, reviewYear, expandedPost, setExpandedPost}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear,
  expandedPost: PostsReviewVotingList|null,
  setExpandedPost: (post: PostsReviewVotingList|null) => void
}) => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking({eventType: "reviewVotingEvent"})
  const { query } = useLocation()
  const { openCommentBox, close } = useCommentBox();
  const { openDialog } = useDialog();

  let reviewPhase = getReviewPhase(reviewYear)
  if (query.phase) {
    reviewPhase = query.phase as ReviewPhase
  }

  const { results, loading: postsLoading, error: postsError } = useMulti({
    terms: {
      view: reviewPhase === "VOTING" ? "reviewFinalVoting" : "reviewVoting",
      before: `${reviewYear+1}-01-01`,
      reviewPhase: reviewPhase,
      after: `${reviewYear}-01-01`,
      limit: 600,
    },
    collectionName: "Posts",
    fragmentName: 'PostsReviewVotingList',
    fetchPolicy: 'cache-and-network',
    skip: !reviewYear
  });
  const postsResults = results ?? null;

  const [submitVote] = useMutation(gql(`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quadraticChange: Int, $newQuadraticScore: Int, $comment: String, $year: String, $dummy: Boolean) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quadraticChange: $quadraticChange, comment: $comment, newQuadraticScore: $newQuadraticScore, year: $year, dummy: $dummy) {
        ...PostsReviewVotingList
      }
    }
  `));

  const [sortedPosts, setSortedPosts] = useState(postsResults)
  const [loading, setLoading] = useState(false)
  const [tagFilter, setTagFilter] = useState<string|null>(null)
  const [statusFilter, setStatusFilter] = useState<string|null>(null)
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
      defaultSort = "reviewVoteScoreHighKarma"
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
    const newPost = post ? {
      __typename: "Post" as const,
      ...post,
      currentUserReviewVote: {
        __typename: "ReviewVote" as const,
        _id: _id || randomId(),
        qualitativeScore: score,
        quadraticScore: 0
      }
    } : undefined;

    return await submitVote({
      variables: {postId, qualitativeScore: score, year: reviewYear+"", dummy: false},
      optimisticResponse: newPost ? {
        submitReviewVote: newPost
      } : undefined
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
        const post1isCurrentUsers = post1.userId === currentUser?._id
        const post2isCurrentUsers = post2.userId === currentUser?._id
        const post1Has2PrelimVotes = post1.positiveReviewVoteCount >= REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD
        const post2Has2PrelimVotes = post2.positiveReviewVoteCount >= REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD

        if (sortPosts === "needsReview") {
          // This prioritizes posts with no reviews, which you highly upvoted
          const post1NeedsReview = post1.reviewCount === 0 && post1.reviewVoteScoreHighKarma > 4
          const post2NeedsReview = post2.reviewCount === 0 && post2.reviewVoteScoreHighKarma > 4
          if (post1NeedsReview && !post2NeedsReview) return -1
          if (post2NeedsReview && !post1NeedsReview) return 1
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



        if (sortPosts === "needsPreliminaryVote") {
          // This is intended to prioritize showing users posts which have reviews but that the current user hasn't yet voted on
          const reviewedNotVoted1 = post1.reviewCount > 0 && !post1Score
          const reviewedNotVoted2 = post2.reviewCount > 0 && !post2Score
          if (reviewedNotVoted1 && !reviewedNotVoted2) return -1
          if (!reviewedNotVoted1 && reviewedNotVoted2) return 1
        }
        if (fieldIn(sortPosts, post1, post2) && post1[sortPosts] > post2[sortPosts]) return -1
        if (fieldIn(sortPosts, post1, post2) && post1[sortPosts] < post2[sortPosts]) return 1

        // if (post1.reviewVoteScoreHighKarma > post2.reviewVoteScoreHighKarma ) return -1
        // if (post1.reviewVoteScoreHighKarma < post2.reviewVoteScoreHighKarma ) return 1

        if (post1Score < post2Score) return 1
        if (post1Score > post2Score) return -1
        if (post1Has2PrelimVotes && !post2Has2PrelimVotes) return -1
        if (!post1Has2PrelimVotes && post2Has2PrelimVotes) return 1
        if (post1NotKarmaVoted && !post2NotKarmaVoted) return 1
        if (post2NotKarmaVoted && !post1NotKarmaVoted) return -1
        if (post1KarmaVote < post2KarmaVote) return 1;
        if (post1KarmaVote > post2KarmaVote) return -1;
        if (post1Read && !post2Read) return -1
        if (post2Read && !post1Read) return 1
        if (post1isCurrentUsers && !post2isCurrentUsers) return -1
        if (post2isCurrentUsers && !post1isCurrentUsers) return 1
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

  let voteTooltip = "Showing votes from all LessWrong users" as voteTooltipType

  const handleSetExpandedPost = (post: PostsReviewVotingList) => {
    if (expandedPost?._id === post._id) {
      setExpandedPost(null)
    } else {
      // Close any existing comment box before opening a new one
      close();
      // this component requires a currentUser so we don't need to do a login check
      openCommentBox({
        commentBox: ({onClose}) => <ReviewPostForm
          onClose={onClose}
          post={post}
        />
      });
      setExpandedPost(post)
    }
  }

  return (
    <AnalyticsContext pageContext="ReviewVotingPage">
    <div className={classes.root}>
      <div className={classes.votingPageContainer}>
      <div className={classes.votingPageHeader}>
        {/* <p>This page shows all posts that passed the nomination round. <br/>Use it to help prioritize your reviewing and update your votes.</p> */}
        <p>Currently sorted by: <b>{sortingInfo[sortPosts].title}</b><em>.<br/>{sortingInfo[sortPosts].description}</em></p> 
        <p>If this page is intimidating, just go to the <Link to={`/quickReview/${reviewYear}`}>Quick Review</Link> page.</p>
      </div>
        <div className={classes.tagListContainer}>
          <PostsTagsList
            posts={postsResults}
            currentFilter={tagFilter}
            handleFilter={(tagId) => handleTagFilter(tagId)}
            defaultMax={5}
            afterChildren={<>
              <LWTooltip title="Only show the post you've read">
                <div className={classNames(classes.statusFilter, {[classes.filterSelected]: statusFilter === 'read'})}
                    onClick={() => handleStatusFilter('read')}>
                Read
              </div>
              </LWTooltip>
            </>}
          />
        </div>
        <ReviewVotingPageMenu reviewPhase={reviewPhase} loading={loading} sortedPosts={sortedPosts} costTotal={costTotal} setSortPosts={setSortPosts} sortPosts={sortPosts} sortReversed={sortReversed} setSortReversed={setSortReversed} postsLoading={postsLoading} postsResults={postsResults} />
        <div className={classNames({[classes.postList]: reviewPhase !== "VOTING", [classes.postsLoading]: postsLoading || loading})}>
          {postsHaveBeenSorted && sortedPosts?.map((post, index) => {
            const currentVote = post.currentUserReviewVote !== null ? {
              _id: post.currentUserReviewVote._id,
              postId: post._id,
              score: post.currentUserReviewVote.qualitativeScore,
              type: "QUALITATIVE" as const
            } : null
            return <div key={post._id} onClick={()=>{
              captureEvent(undefined, {eventSubType: "voteTableRowClicked", postId: post._id})}}
            >
              <ReviewVoteTableRow
                post={post}
                index={index}
                costTotal={costTotal}
                showKarmaVotes={showKarmaVotes}
                dispatch={dispatchQualitativeVote}
                currentVote={currentVote}
                expandedPostId={expandedPost?._id}
                handleSetExpandedPost={handleSetExpandedPost}
                reviewPhase={reviewPhase}
                reviewYear={reviewYear}
                voteTooltip={voteTooltip}
              />
            </div>
            })}
          </div>
          {(postsHaveBeenSorted && (sortedPosts?.length ?? 0) > 30) && <div className={classes.tagListContainer}>
            <PostsTagsList
              posts={postsResults}
              currentFilter={tagFilter}
              handleFilter={(tagId) => handleTagFilter(tagId)}
              defaultMax={5}
              afterChildren={<>
                <LWTooltip title="Only show the post you've read">
                  <div className={classNames(classes.statusFilter, {[classes.filterSelected]: statusFilter === 'read'})}
                      onClick={() => handleStatusFilter('read')}>
                  Read
                </div>
                </LWTooltip>
              </>}
            />
          </div>}
        </div>
    </div>
    </AnalyticsContext>
  );
}

export default registerComponent('ReviewVotingPage', ReviewVotingPage, {styles});


