import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React, { useCallback } from 'react';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { REVIEW_YEAR } from './NominatePostMenuItem';
import { ReviewVote } from './ReviewVotingPage';

const styles = (theme) => ({
  root: {
    background: "white",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    padding: 12,
    borderRadius: 2
  }
})

const ReviewVotingWidget = ({classes, post}: {classes:ClassesType, post: PostsBase}) => {

  const { ReviewVotingButtons, Loading, ErrorBoundary } = Components

  const currentUser = useCurrentUser()

  const { results: votes, loading: votesLoading, error: voteLoadingError } = useMulti({
    terms: {view: "reviewVotesForPostAndUser", limit: 1, userId: currentUser?._id, postId: post._id},
    collectionName: "ReviewVotes",
    fragmentName: "reviewVoteFragment",
    fetchPolicy: 'cache-and-network',
  })

  // TODO: Refactor these + the ReviewVotingPage dispatch
  const [submitVote] = useMutation(gql`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quadraticChange: Int, $newQuadraticScore: Int, $comment: String, $year: String, $dummy: Boolean, $reactions: [String]) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quadraticChange: $quadraticChange, comment: $comment, newQuadraticScore: $newQuadraticScore, year: $year, dummy: $dummy, reactions: $reactions) {
        ...reviewVoteFragment
      }
    }
    ${getFragment("reviewVoteFragment")}
  `, {
    update: (store, mutationResult) => {
      updateEachQueryResultOfType({
        func: handleUpdateMutation,
        document: mutationResult.data.submitReviewVote,
        store, typeName: "ReviewVote",
      });
    }
  });

  const dispatchQualitativeVote = useCallback(async ({_id, postId, score, reactions}: {
    _id: string|null,
    postId: string,
    score: number,
    reactions: string[],
  }) => {
    return await submitVote({variables: {postId, qualitativeScore: score, year: 2020+"", dummy: false}})
  }, [submitVote]);

  if (voteLoadingError) return <div>{voteLoadingError.message}</div>

  const rawVote = votes[0] 
  const vote = rawVote ? {
    _id: rawVote._id, 
    postId: rawVote.postId, 
    score: rawVote.qualitativeScore, 
    type: "qualitative"
  } as ReviewVote : null

  return <ErrorBoundary>
      <div className={classes.root}>
        <p>{REVIEW_YEAR} Review: Was this post important?</p>
        {/* <p>Should this post be considered for the {REVIEW_YEAR} Review?</p> */}
        <ReviewVotingButtons postId={post._id} dispatch={dispatchQualitativeVote} voteForCurrentPost={vote} />
      </div>
    </ErrorBoundary>
}

const ReviewVotingWidgetComponent = registerComponent('ReviewVotingWidget', ReviewVotingWidget, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingWidget: typeof ReviewVotingWidgetComponent
  }
}