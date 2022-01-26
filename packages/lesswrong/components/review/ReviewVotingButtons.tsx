import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';
import forumThemeExport from '../../themes/forumTheme';
import { DEFAULT_QUALITATIVE_VOTE } from '../../lib/collections/reviewVotes/schema';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { eligibleToNominate } from '../../lib/reviewUtils';
import round from 'lodash/round';

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

const getPointsFromCost = (cost) => {
  // the formula to quadratic cost from a number of points is (n^2 + n)/2
  // this uses the inverse of that formula to take in a cost and output a number of points
  return (-1 + Math.sqrt((8 * cost)+1)) / 2
}

const getLabelFromCost = (cost) => {
  // rounds the points to 1 decimal for easier reading
  return round(getPointsFromCost(cost), 1)
}

export const getReviewVoteCostData = ({costTotal=0}:{costTotal?:number}) => {
  // This 
  const divider = costTotal > 500 ? costTotal/500 : 1
  return ({
    0: {label: null, cost: 0, tooltip: null},
    1: { label: `-${getLabelFromCost(45/divider)}`, cost: 45, tooltip: 
      <div>
        <p>Highly misleading, harmful, or unimportant.</p>
        <p><em>Costs 45 points</em></p>
      </div>},
    2: { label: `-${getLabelFromCost(10/divider)}`, cost: 10, tooltip: 
    <div>
      <p>Very misleading, harmful, or unimportant.</p>
      <p><em>Costs 10 points</em></p>
    </div>},
    3: { label: `-${getLabelFromCost(1/divider)}`, cost: 1, tooltip: 
    <div>
      <p>Misleading, harmful or unimportant.</p>
      <p><em>Costs 1 point</em></p>
    </div>},
    4: { label: `0`, cost: 0, tooltip: 
    <div>
      <p>No strong opinion on this post,</p>
      <p><em>Costs 0 points</em></p>
    </div>},
    5: { label: `${getLabelFromCost(1/divider)}`, cost: 1, tooltip: 
    <div>
      <p>Good</p>
      <p><em>Costs 1 point</em></p>
    </div>},
    6: { label: `${getLabelFromCost(10/divider)}`, cost: 10, tooltip: 
    <div>
      <p>Quite important</p>
      <p><em>Costs 10 points</em></p>
    </div>},
    7: { label: `${getLabelFromCost(45/divider)}`, cost: 45, tooltip: 
    <div>
      <p>Extremely important</p>
      <p><em>Costs 45 points</em></p>
    </div>},
  })
}


const ReviewVotingButtons = ({classes, post, dispatch, currentUserVoteScore, costTotal }: {classes: ClassesType, post: PostsMinimumInfo, dispatch: any, currentUserVoteScore: number|null, costTotal?: number}) => {
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
          return <LWTooltip title={getReviewVoteCostData({costTotal})[i].tooltip} 
          key={`${getReviewVoteCostData({costTotal})[i]}-${i}`}>
            <span
                className={classNames(classes.button, classes[i], {
                  [classes.selectionHighlight]:selection === i && !isDefaultVote,
                  [classes.defaultHighlight]: selection === i && isDefaultVote
                })}
                onClick={createClickHandler(i)}
              >
              {getReviewVoteCostData({costTotal})[i].label}
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
