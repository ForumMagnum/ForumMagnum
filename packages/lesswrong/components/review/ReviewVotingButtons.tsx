import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';
import forumThemeExport from '../../themes/forumTheme';
import { DEFAULT_QUALITATIVE_VOTE } from '../../lib/collections/reviewVotes/schema';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { eligibleToNominate, getCostData } from '../../lib/reviewUtils';
import { SyntheticQualitativeVote } from './ReviewVotingPage';

const downvoteColor = "rgba(125,70,70, .87)"
const upvoteColor = forumTypeSetting.get() === "EAForum" ? forumThemeExport.palette.primary.main : "rgba(70,125,70, .87)"

const styles = (theme: ThemeType) => ({
  root: { 
    whiteSpace: "pre"
  },
  button: {
    paddingTop: 3,
    paddingBottom: 3,
    marginRight: 2,
    display: "inline-block",
    border: "solid 1px rgba(0,0,0,.1)",
    borderRadius: 3,
    width: 26,
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

const ReviewVotingButtons = ({classes, post, dispatch, currentUserVote, costTotal}: {classes: ClassesType, post: PostsMinimumInfo, dispatch: any, currentUserVote: SyntheticQualitativeVote|null, costTotal?: number}) => {
  const { LWTooltip } = Components

  const currentUser = useCurrentUser()

  const [selection, setSelection] = useState(currentUserVote?.score || DEFAULT_QUALITATIVE_VOTE)
  const [isDefaultVote, setIsDefaultVote] = useState(!currentUserVote?.score)

  const createClickHandler = (index:number) => {
    return (e:React.MouseEvent) => {
      // We don't want to change the currently focused post when clicking
      // on the vote buttons, so we stop the event here
      e.preventDefault()
      e.stopPropagation()
      setSelection(index)
      setIsDefaultVote(false)
      dispatch({_id: currentUserVote?._id, postId: post._id, score: index})
    }
  }

  if (currentUser?._id === post.userId) return <div className={classes.root}>You can't vote on your own posts</div>

  if (!eligibleToNominate(currentUser)) return <div className={classes.root}>You aren't eligible to vote</div>

  return <AnalyticsContext pageElementContext="reviewVotingButtons">
    <div className={classes.root}>
        {[1,2,3,4,5,6,7].map((i) => {
          return <LWTooltip title={getCostData({costTotal})[i].tooltip} 
          key={`${getCostData({costTotal})[i]}-${i}`}>
            <span
                className={classNames(classes.button, classes[i], {
                  [classes.selectionHighlight]:selection === i && !isDefaultVote,
                  [classes.defaultHighlight]: selection === i && isDefaultVote
                })}
                onClick={createClickHandler(i)}
              >
              {getCostData({costTotal})[i].label}
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
