import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React, { useCallback } from 'react';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { REVIEW_NAME_IN_SITU } from '../../lib/reviewUtils';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { SyntheticReviewVote } from './ReviewVotingPage';
import { Link } from '../../lib/reactRouterWrapper';
import { annualReviewAnnouncementPostPathSetting } from '../../lib/publicSettings';
import { overviewTooltip } from './FrontpageReviewWidget';

const styles = (theme) => ({
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

const ReviewVotingWidget = ({classes, post, setNewVote}: {classes:ClassesType, post: PostsBase, title?: React.ReactNode, setNewVote?: (newVote:number)=>void}) => {

  const { ReviewVotingButtons, ErrorBoundary, Loading, LWTooltip } = Components

  const currentUser = useCurrentUser()

  const { results: votes, loading: voteLoading, error: voteLoadingError } = useMulti({
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

  const dispatchQualitativeVote = useCallback(async ({_id, postId, score}: {
    _id: string|null,
    postId: string,
    score: number
  }) => {
    if (setNewVote) setNewVote(score)
    return await submitVote({variables: {postId, qualitativeScore: score, year: 2020+"", dummy: false}})
  }, [submitVote, setNewVote]);

  if (voteLoadingError) return <div>{voteLoadingError.message}</div>
  const vote = votes?.length ? {
    postId: votes[0].postId, 
    score: votes[0].qualitativeScore, 
    type: "QUALITATIVE" as const,
  } : null

  return <ErrorBoundary>
      <div className={classes.root}>
        <p>
          Vote on this post for the <LWTooltip title={overviewTooltip}><Link to={annualReviewAnnouncementPostPathSetting.get()}>{REVIEW_NAME_IN_SITU}</Link></LWTooltip>
        </p>
        {voteLoading ? <Loading/> : <ReviewVotingButtons postId={post._id} dispatch={dispatchQualitativeVote} voteForCurrentPost={vote}/>}
      </div>
    </ErrorBoundary>
}

const ReviewVotingWidgetComponent = registerComponent('ReviewVotingWidget', ReviewVotingWidget, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingWidget: typeof ReviewVotingWidgetComponent
  }
}
