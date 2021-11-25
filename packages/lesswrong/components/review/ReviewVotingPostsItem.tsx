import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { canNominate } from './NominatePostMenuItem';
import { reviewVotingButtonStyles } from './ReviewVotingButtons';
import { useMutation, gql } from '@apollo/client';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { getFragment } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  root: {
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    padding: 4,
    color: theme.palette.grey[700],
    cursor: "pointer",
    border: "solid 1px #ddd",
    borderRadius: 2,
    marginRight: 8,
    '&:hover': {
      background: "#eee"
    }
  }
})

const ReviewVotingPostsItem = ({classes, post}:{classes: ClassesType, post: PostsList}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const currentUser = useCurrentUser()
  const { ReviewVotingWidget, PopperCard } = Components

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

  if (!canNominate(currentUser, post)) return null 
  
  return <div className={classes.root} onMouseLeave={() => setAnchorEl(null)} onClick={(e) => setAnchorEl(e.target)}>
        Vote
        {anchorEl && <PopperCard open={Boolean(anchorEl)} anchorEl={anchorEl} placement="right">
          {/* <ReviewVotingWidget /> */}
        </PopperCard>}
      </div>
}

const ReviewVotingPostsItemComponent = registerComponent('ReviewVotingPostsItem', ReviewVotingPostsItem, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingPostsItem: typeof ReviewVotingPostsItemComponent
  }
}

