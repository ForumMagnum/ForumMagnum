import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { vote } from './ReviewVotingPage';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  vote: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    paddingLeft: 10,
    paddingRight: 10,
    cursor: "pointer"
  },
  score: {
    ...theme.typography.body1,
    ...theme.typography.commentStyle
  }
})


const QuadraticVotingButtons = ({classes, postId, vote, votes }: {classes: ClassesType, postId: string, vote: any, votes: vote[]}) => {
  const voteForCurrentPost = votes.find(vote => vote.postId === postId)
  const createClickHandler = (postId: string, type: 'buy' | 'sell', voteId: string | undefined, score: number | undefined) => {
      return () => {
        vote({postId, change: (type === 'buy' ? 1 : -1), _id: voteId, previousValue: score})
      }
  }
  return <div className={classes.root}>
    <span className={classes.vote} onClick={createClickHandler(postId, 'sell', voteForCurrentPost?._id, voteForCurrentPost?.score)}>–</span>
    <span className={classes.score}>{voteForCurrentPost?.score || 0}</span>
    <span className={classes.vote} onClick={createClickHandler(postId, 'buy', voteForCurrentPost?._id, voteForCurrentPost?.score)}>+</span>
  </div>
}

const QuadraticVotingButtonsComponent = registerComponent("QuadraticVotingButtons", QuadraticVotingButtons, {styles});

declare global {
  interface ComponentTypes {
    QuadraticVotingButtons: typeof QuadraticVotingButtonsComponent
  }
}
