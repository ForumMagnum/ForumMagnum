import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import React, { useCallback } from 'react';
import { eligibleToNominate, getReviewNameInSitu, REVIEW_YEAR, VoteIndex } from '../../lib/reviewUtils';
import { Link } from '../../lib/reactRouterWrapper';
import { ReviewOverviewTooltip } from './FrontpageReviewWidget';
import { useCurrentUser } from '../common/withUser';
import { registerComponent } from "../../lib/vulcan-lib/components";
import ReviewVotingButtons from "./ReviewVotingButtons";
import ErrorBoundary from "../common/ErrorBoundary";
import LWTooltip from "../common/LWTooltip";
import { reviewVotesForPostAndUserQuery, useCurrentUserReviewVote } from "../hooks/useCurrentUserReviewVote";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    textAlign: "center",
    color: theme.palette.grey[800],
    padding: theme.spacing.unit,
    '& a': {
      color: theme.palette.primary.main
    }
  }
})

const ReviewVotingWidget = ({classes, post, showTitle=true}: {
  classes: ClassesType<typeof styles>,
  post: PostsMinimumInfo,
  showTitle?: boolean,
}) => {
  const currentUser = useCurrentUser()

  // TODO: Refactor these + the ReviewVotingPage dispatch
  const [submitVote] = useMutation(gql(`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quadraticChange: Int, $newQuadraticScore: Int, $comment: String, $year: String, $dummy: Boolean) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quadraticChange: $quadraticChange, comment: $comment, newQuadraticScore: $newQuadraticScore, year: $year, dummy: $dummy) {
        ...PostsReviewVotingList
      }
    }
  `));

  const dispatchQualitativeVote = useCallback(async ({_id, postId, score}: {
    _id: string|null,
    postId: string,
    score: VoteIndex
  }) => {
    return await submitVote({
      variables: {postId, qualitativeScore: score, year: REVIEW_YEAR.toString(), dummy: false},
      refetchQueries: [{ query: reviewVotesForPostAndUserQuery, variables: { postId, userId: currentUser?._id } }],
    })
  }, [submitVote, currentUser?._id]);

  const skip = !eligibleToNominate(currentUser);

  const { vote: currentUserReviewVote, loading } = useCurrentUserReviewVote(post._id, skip);
  
  if (skip) return null
  if (loading) return <Loading />

  const currentUserVote = currentUserReviewVote !== null ? {
    _id: currentUserReviewVote._id,
    postId: post._id,
    score: currentUserReviewVote.qualitativeScore || 0,
    type: "QUALITATIVE" as const
  } : null

  return <ErrorBoundary>
      <div className={classes.root}>
        {showTitle && <p>
          Vote on this post for the <LWTooltip title={<ReviewOverviewTooltip/>}><Link to={"/reviewVoting"}>{getReviewNameInSitu()}</Link></LWTooltip>
        </p>}
        <ReviewVotingButtons post={post} dispatch={dispatchQualitativeVote} currentUserVote={currentUserVote}/>
      </div>
    </ErrorBoundary>
}

export default registerComponent('ReviewVotingWidget', ReviewVotingWidget, {styles});


