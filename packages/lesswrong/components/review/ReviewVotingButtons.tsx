import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { ReviewVote } from './ReviewVotingPage';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  button: {
    padding: theme.spacing.unit,
    paddingTop: 6,
    paddingBottom: 6,
    marginRight: 2,
    textAlign: "center",
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    cursor: "pointer",
    '&:hover': {
      backgroundColor: "rgba(0,0,0,.075)",
    }
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
  0: { label: "-16", tooltip: "Highly misleading or harmful"},
  1: { label: "-4", tooltip: "Very misleading or harmful"},
  2: { label: "-1", tooltip: "Misleading, harmful or unimportant"},
  3: { label: "0", tooltip: "No strong opinion on this post"},
  4: { label: "1", tooltip: "Good."},
  5: { label: "4", tooltip: "Quite important."},
  6: { label: "16", tooltip: "A crucial piece of intellectual work."},
}


const ReviewVotingButtons = ({classes, postId, dispatch, voteForCurrentPost}: {classes: ClassesType, postId: string, dispatch: any, voteForCurrentPost: ReviewVote|null}) => {
  const { LWTooltip } = Components
  const score = voteForCurrentPost?.score
  const [selection, setSelection] = useState(voteForCurrentPost ? score : 1)

  const createClickHandler = (index:number) => {
    return () => {
      setSelection(index)
      dispatch({postId, score: index})
    }
  }

  return <div>
      {[0,1,2,3,4,5,6].map((i) => {
        return <LWTooltip title={indexToTermsLookup[i].tooltip} 
        key={`${indexToTermsLookup[i]}-${i}`}>
          <span
              className={classNames(classes.button, {
                [classes.selectionHighlight]:selection === i && score,
                [classes.defaultHighlight]: selection === i && !score
              })}
              onClick={createClickHandler(i)}
            >
            {indexToTermsLookup[i].label}
          </span>
        </LWTooltip>
      })}
  </div>
}

const ReviewVotingButtonsComponent = registerComponent("ReviewVotingButtons", ReviewVotingButtons, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingButtons: typeof ReviewVotingButtonsComponent
  }
}
