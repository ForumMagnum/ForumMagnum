import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { DEFAULT_QUALITATIVE_VOTE } from '../../lib/collections/reviewVotes/newSchema';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { eligibleToNominate, getCostData, reviewIsActive } from '../../lib/reviewUtils';
import type { SyntheticQualitativeVote } from './ReviewVotingPage';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => {
  const downvoteColor = theme.palette.text.reviewDownvote;
  const upvoteColor = isFriendlyUI ? theme.palette.primary.main : theme.palette.text.reviewUpvote;
  
  return {
    root: { 
      whiteSpace: "pre",
      ...theme.typography.commentStyle,
    },
    button: {
      paddingTop: 3,
      paddingBottom: 3,
      marginRight: 2,
      display: "inline-block",
      border: theme.palette.border.faint,
      borderRadius: 3,
      width: 26,
      textAlign: "center",
      ...theme.typography.smallText,
      ...theme.typography.commentStyle,
      cursor: "pointer",
      background: theme.palette.panelBackground.default,
      '&:hover': {
        backgroundColor: theme.palette.greyAlpha(.075),
      }
    },
    selectionHighlight: {
      backgroundColor: theme.palette.greyAlpha(.5),
      color: theme.palette.text.invertedBackgroundText,
      borderRadius: 3
    },
    defaultHighlight: {
      backgroundColor: theme.palette.greyAlpha(.075),
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
  }
}

const ReviewVotingButtons = ({classes, post, dispatch, currentUserVote, costTotal}: {classes: ClassesType<typeof styles>, post: PostsMinimumInfo, dispatch: any, currentUserVote: SyntheticQualitativeVote|null, costTotal?: number}) => {
  const { LWTooltip } = Components

  const currentUser = useCurrentUser()

  const [selection, setSelection] = useState(currentUserVote?.score || DEFAULT_QUALITATIVE_VOTE)
  const [isDefaultVote, setIsDefaultVote] = useState(!currentUserVote?.score)

  const createClickHandler = (index: number) => {
    return (e: React.MouseEvent) => {
      // We don't want to change the currently focused post when clicking
      // on the vote buttons, so we stop the event here
      e.preventDefault()
      e.stopPropagation()
      setSelection(index)
      setIsDefaultVote(false)
      dispatch({_id: currentUserVote?._id, postId: post._id, score: index})
    }
  }

  if (!reviewIsActive()) return <div className={classes.root}>Voting period is over.</div>

  if (currentUser?._id === post.userId) return <div className={classes.root}>You can't vote on your own posts</div>

  if (!eligibleToNominate(currentUser)) return <div className={classes.root}>You aren't eligible to vote</div>

  return <AnalyticsContext pageElementContext="reviewVotingButtons">
    <div className={classes.root}>
        {([1,2,3,4,5,6,7] as const).map((i) => {
          return <LWTooltip title={getCostData({costTotal})[i].tooltip} 
          key={`${getCostData({costTotal})[i]}-${i}`}>
            <span
                className={classNames(classes.button, classes[i], {
                  [classes.selectionHighlight]:selection === i && !isDefaultVote,
                  [classes.defaultHighlight]: selection === i && isDefaultVote
                })}
                onClick={createClickHandler(i)}
              >
              {getCostData({costTotal})[i].value}
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
