import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { ReviewVote } from './ReviewVotingPage';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';
import forumThemeExport from '../../themes/forumTheme';

const downvoteColor = "rgba(125,70,70, .87)"
// TODO;
const upvoteColor = forumTypeSetting.get() === "EAForum" ? forumThemeExport.palette.primary.main : "rgba(70,125,70, .87)"

const styles = (theme: ThemeType) => ({
  button: {
    paddingTop: 4,
    paddingBottom: 4,
    marginRight: 2,
    display: "inline-block",
    border: "solid 1px rgba(0,0,0,.1)",
    borderRadius: 3,
    width: 28,
    textAlign: "center",
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
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
  0: { color: downvoteColor},
  1: { color: downvoteColor},
  2: { color: downvoteColor},
  3: { color: theme.palette.grey[700]},
  4: { color: upvoteColor},
  5: { color: upvoteColor},
  6: { color: upvoteColor},
})

export const indexToTermsLookup = {
  0: { label: "-9", tooltip: "Highly misleading, harmful, or unimportant."},
  1: { label: "-4", tooltip: "Very misleading, harmful, or unimportant."},
  2: { label: "-1", tooltip: "Misleading, harmful or unimportant"},
  3: { label: "0", tooltip: "No strong opinion on this post"},
  4: { label: "1", tooltip: "Good."},
  5: { label: "4", tooltip: "Quite important."},
  6: { label: "9", tooltip: "A crucial piece of intellectual work."},
}


const ReviewVotingButtons = ({classes, postId, dispatch, voteForCurrentPost}: {classes: ClassesType, postId: string, dispatch: any, voteForCurrentPost: ReviewVote|null}) => {
  const { LWTooltip } = Components
  const score = voteForCurrentPost?.score
  const [selection, setSelection] = useState(voteForCurrentPost ? score : 3)

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
              className={classNames(classes.button, classes[i], {
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
