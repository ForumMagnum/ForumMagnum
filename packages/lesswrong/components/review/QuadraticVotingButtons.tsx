import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { SyntheticQuadraticVote } from './ReviewVotingPage';

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


const QuadraticVotingButtonsInner = ({classes, postId, vote, voteForCurrentPost }: {classes: ClassesType<typeof styles>, postId: string, vote: any, voteForCurrentPost: SyntheticQuadraticVote|null}) => {
  const clickHandler = (type: 'buy' | 'sell') => {
    vote({
      postId,
      change: (type === 'buy' ? 1 : -1),
      previousValue: voteForCurrentPost?.score,
    })
  }
  return <div className={classes.root}>
    <span className={classes.vote} onClick={() => clickHandler('sell')}>–</span>
    <span className={classes.score}>{voteForCurrentPost?.score || 0}</span>
    <span className={classes.vote} onClick={() => clickHandler('buy')}>+</span>
  </div>
}

export const QuadraticVotingButtons = registerComponent("QuadraticVotingButtons", QuadraticVotingButtonsInner, {styles});

declare global {
  interface ComponentTypes {
    QuadraticVotingButtons: typeof QuadraticVotingButtons
  }
}
