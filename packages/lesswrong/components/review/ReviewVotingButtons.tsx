import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { ReviewVote } from './ReviewVotingPage2019';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  button: {
    padding: theme.spacing.unit,
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    cursor: "pointer"
  },
  selectionHighlight: {
    backgroundColor: "rgba(0,0,0,.5)",
    color: "white",
    borderRadius: 3
  },
  defaultHighlight: {
    backgroundColor: "rgba(0,0,0,.075)",
    borderRadius: 3
  },
})

const indexToTermsLookup = {
  0: "No",
  1: "Neutral",
  2: "Somewhat",
  3: "Very",
  4: "Crucial"
}


const ReviewVotingButtons = ({classes, postId, dispatch, voteForCurrentPost}: {classes: ClassesType, postId: string, dispatch: any, voteForCurrentPost: ReviewVote|null}) => {
  const score = voteForCurrentPost?.score
  const [selection, setSelection] = useState(voteForCurrentPost ? score : 1)

  const createClickHandler = (index:number) => {
    return () => {
      setSelection(index)
      dispatch({postId, score: index})
    }
  }

  return <div>
      {[0,1,2,3,4].map((i) => {
        return <span
          className={classNames(classes.button, {
            [classes.selectionHighlight]:selection === i && score,
            [classes.defaultHighlight]: selection === i && !score
          })}
          onClick={createClickHandler(i)}
          key={`${indexToTermsLookup[i]}-${i}`}
        >
          {indexToTermsLookup[i]}
        </span>
      })}
  </div>
}

const ReviewVotingButtonsComponent = registerComponent("ReviewVotingButtons", ReviewVotingButtons, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingButtons: typeof ReviewVotingButtonsComponent
  }
}
