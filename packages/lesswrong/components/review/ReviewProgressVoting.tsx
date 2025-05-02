import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { ReviewYear } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import CropSquareIcon from '@/lib/vendor/@material-ui/icons/src/CropSquare';
import range from 'lodash/range';

const styles = (theme: ThemeType) => ({
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

export const TARGET_REVIEW_VOTING_NUM = 6

export const ReviewProgressVoting = ({classes, reviewYear}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear
}) => {

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
    limit: TARGET_REVIEW_VOTING_NUM
  });

  if (!reviewsResults) return null

  const totalVotes = totalCount || 0
  const uncheckedBoxes = TARGET_REVIEW_VOTING_NUM - Math.min(totalVotes, TARGET_REVIEW_VOTING_NUM)

  return <div><LWTooltip title={<div>
    <p><em>{totalVotes ? `You've voted on ${totalVotes} posts in the ${reviewYear} Review${totalVotes >= TARGET_REVIEW_VOTING_NUM ? "!" : "."}` : "You haven't voted on any posts yet."}</em></p>
    {totalVotes < TARGET_REVIEW_VOTING_NUM && <>
    <div>It'd be helpful if you voted on at least {TARGET_REVIEW_VOTING_NUM} posts. More votes from established users improves the signal/noise of the review vote. (If there weren't {TARGET_REVIEW_VOTING_NUM} posts you found longterm valuable, it's fine to vote "0").</div></>}</div>} placement="top">
  <div className={classes.root}>
    {reviewsResults.map(review => {
      return <div className={classes.filledIcon} key={review._id}/>
    })}
    {range(0, uncheckedBoxes).map(a => <CropSquareIcon className={classes.icon} key={`${currentUser?._id}${a}`}/>) }
  </div>
</LWTooltip></div>
}

const ReviewProgressVotingComponent = registerComponent('ReviewProgressVoting', ReviewProgressVoting, {styles});

declare global {
  interface ComponentTypes {
    ReviewProgressVoting: typeof ReviewProgressVotingComponent
  }
}

