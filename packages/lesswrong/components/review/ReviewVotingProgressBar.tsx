import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { ReviewYear } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import CropSquareIcon from '@material-ui/icons/CropSquare';
import range from 'lodash/range';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    marginRight: 4
  },
  icon: {
    width: 16,
    color: theme.palette.grey[500],
    transform: "rotate(45deg)",
  },
  filledIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    border: theme.palette.border.intense,
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
    opacity: .7,
    transform: "rotate(45deg)",
    borderRadius: 2
  },
});

export const ReviewVotingProgressBar = ({classes, reviewYear}: {
  classes: ClassesType,
  reviewYear: ReviewYear
}) => {

  const TARGET_NUM = 6

  const currentUser = useCurrentUser()

  const { LWTooltip } = Components

  const { results: reviewsResults, totalCount } = useMulti({
    terms: {
      view: "reviewVotesFromUser",
      userId: currentUser?._id,
      year: reviewYear.toString()
    },
    collectionName: "ReviewVotes",
    fragmentName: 'reviewVoteFragment',
    enableTotal: true,
    skip: !currentUser,
    limit: TARGET_NUM
  });

  if (!reviewsResults) return null

  const totalVotes = totalCount || 0
  const uncheckedBoxes = TARGET_NUM - Math.min(totalVotes, TARGET_NUM)

  return <div><LWTooltip title={<div>
    <p><em>{totalVotes ? `You've voted on ${totalVotes} posts in the ${reviewYear} Review${totalVotes >= TARGET_NUM ? "!" : "."}` : "You haven't voted on any posts yet."}</em></p>
    {totalVotes < TARGET_NUM && <>
    <div>It'd be helpful if you voted on at least {TARGET_NUM} posts. More votes from established users improves the signal/noise of the review vote. (If there weren't {TARGET_NUM} posts you found longterm valuable, it's fine to vote "0").</div></>}</div>} placement="top">
  <div className={classes.root}>
    {reviewsResults.map(review => {
      return <div className={classes.filledIcon} key={review._id}/>
    })}
    {range(0, uncheckedBoxes).map(a => <CropSquareIcon className={classes.icon} key={`${currentUser?._id}${a}`}/>) }
  </div>
</LWTooltip></div>
}

const ReviewVotingProgressBarComponent = registerComponent('ReviewVotingProgressBar', ReviewVotingProgressBar, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingProgressBar: typeof ReviewVotingProgressBarComponent
  }
}

