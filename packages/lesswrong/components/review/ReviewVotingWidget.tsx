import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React, { useCallback } from 'react';
import { eligibleToNominate, REVIEW_NAME_IN_SITU, REVIEW_YEAR, VoteIndex } from '../../lib/reviewUtils';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { ReviewOverviewTooltip } from './FrontpageReviewWidget';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
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

const ReviewVotingWidget = ({classes, post, setNewVote, showTitle=true}: {classes: ClassesType, post: PostsMinimumInfo, showTitle?: boolean, setNewVote?: (newVote: VoteIndex) => void}) => {

  const { ReviewVotingButtons, ErrorBoundary, LWTooltip } = Components
  
  const currentUser = useCurrentUser()

  // TODO: Refactor these + the ReviewVotingPage dispatch
  const [submitVote] = useMutation(gql`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quadraticChange: Int, $newQuadraticScore: Int, $comment: String, $year: String, $dummy: Boolean) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quadraticChange: $quadraticChange, comment: $comment, newQuadraticScore: $newQuadraticScore, year: $year, dummy: $dummy) {
        ...PostsReviewVotingList
      }
    }
    ${getFragment("PostsReviewVotingList")} 
  `);

  const dispatchQualitativeVote = useCallback(async ({_id, postId, score}: {
    _id: string|null,
    postId: string,
    score: VoteIndex
  }) => {
    if (setNewVote) setNewVote(score)
    return await submitVote({variables: {postId, qualitativeScore: score, year: REVIEW_YEAR.toString(), dummy: false}})
  }, [submitVote, setNewVote]);

  if (!eligibleToNominate(currentUser)) return null

  const currentUserVote = post.currentUserReviewVote !== null ? {
    _id: post.currentUserReviewVote._id,
    postId: post._id,
    score: post.currentUserReviewVote.qualitativeScore || 0,
    type: "QUALITATIVE" as const
  } : null

  return <ErrorBoundary>
      <div className={classes.root}>
        {showTitle && <p>
          Vote on this post for the <LWTooltip title={<ReviewOverviewTooltip/>}><Link to={"/reviewVoting"}>{REVIEW_NAME_IN_SITU}</Link></LWTooltip>
        </p>}
        <ReviewVotingButtons post={post} dispatch={dispatchQualitativeVote} currentUserVote={currentUserVote}/>
      </div>
    </ErrorBoundary>
}

const ReviewVotingWidgetComponent = registerComponent('ReviewVotingWidget', ReviewVotingWidget, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingWidget: typeof ReviewVotingWidgetComponent
  }
}
