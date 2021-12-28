import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';
import forumThemeExport from '../../themes/forumTheme';
import { DEFAULT_QUALITATIVE_VOTE } from '../../lib/collections/reviewVotes/schema';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { eligibleToNominate } from '../../lib/reviewUtils';

const downvoteColor = "rgba(125,70,70, .87)"
const upvoteColor = forumTypeSetting.get() === "EAForum" ? forumThemeExport.palette.primary.main : "rgba(70,125,70, .87)"

const styles = (theme: ThemeType) => ({
  root: { 
    whiteSpace: "pre"
  },
  button: {
    paddingTop: 2,
    paddingBottom: 2,
    marginRight: 2,
    display: "inline-block",
    border: "solid 1px rgba(0,0,0,.1)",
    borderRadius: 3,
    width: 24,
    textAlign: "center",
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    cursor: "pointer",
    background: "white",
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
  0: {},
  1: { color: downvoteColor},
  2: { color: downvoteColor},
  3: { color: downvoteColor},
  4: { color: theme.palette.grey[700]},
  5: { color: upvoteColor},
  6: { color: upvoteColor},
  7: { color: upvoteColor},
})

export const indexToTermsLookup = {
  0: {label: null, tooltip: null},
  1: { label: "-9", tooltip: "Highly misleading, harmful, or unimportant."},
  2: { label: "-4", tooltip: "Very misleading, harmful, or unimportant."},
  3: { label: "-1", tooltip: "Misleading, harmful or unimportant"},
  4: { label: "0", tooltip: "No strong opinion on this post"},
  5: { label: "1", tooltip: "Good."},
  6: { label: "4", tooltip: "Quite important."},
  7: { label: "9", tooltip: "A crucial piece of intellectual work."},
}


const ReviewVotingButtons = ({classes, post, dispatch, currentUserVoteScore}: {classes: ClassesType, post: PostsMinimumInfo, dispatch: any, currentUserVoteScore: number|null}) => {
  const { LWTooltip } = Components

  const currentUser = useCurrentUser()

  const [selection, setSelection] = useState(currentUserVoteScore || DEFAULT_QUALITATIVE_VOTE)
  const [isDefaultVote, setIsDefaultVote] = useState(!currentUserVoteScore)

  const createClickHandler = (index:number) => {
    return () => {
      setSelection(index)
      setIsDefaultVote(false)
      dispatch({postId: post._id, score: index})
    }
  }

  if (currentUser?._id === post.userId) return <div className={classes.root}>You can't vote on your own posts</div>

  if (!eligibleToNominate(currentUser)) return <div className={classes.root}>You aren't eligible to vote</div>

  return <AnalyticsContext pageElementContext="reviewVotingButtons">
    <div className={classes.root}>
        {[1,2,3,4,5,6,7].map((i) => {
          return <LWTooltip title={indexToTermsLookup[i].tooltip} 
          key={`${indexToTermsLookup[i]}-${i}`}>
            <span
                className={classNames(classes.button, classes[i], {
                  [classes.selectionHighlight]:selection === i && !isDefaultVote,
                  [classes.defaultHighlight]: selection === i && isDefaultVote
                })}
                onClick={createClickHandler(i)}
              >
              {indexToTermsLookup[i].label}
            </span>
          </LWTooltip>
        })}
    </div>
  </AnalyticsContext>
}

const ReviewVotingButtonsComponent = registerComponent("ReviewVotingButtons", ReviewVotingButtons, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingButtons: typeof ReviewVotingButtonsComponent
  }
}
