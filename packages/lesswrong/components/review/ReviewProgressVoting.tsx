import React from 'react';
import { ReviewYear } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import CropSquareIcon from '@/lib/vendor/@material-ui/icons/src/CropSquare';
import range from 'lodash/range';
import LWTooltip from "../common/LWTooltip";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const reviewVoteFragmentMultiQuery = gql(`
  query multiReviewVoteReviewProgressVotingQuery($selector: ReviewVoteSelector, $limit: Int, $enableTotal: Boolean) {
    reviewVotes(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...reviewVoteFragment
      }
      totalCount
    }
  }
`);

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
  const { data } = useQuery(reviewVoteFragmentMultiQuery, {
    variables: {
      selector: { reviewVotesFromUser: { userId: currentUser?._id, year: reviewYear.toString() } },
      limit: TARGET_REVIEW_VOTING_NUM,
      enableTotal: true,
    },
    skip: !currentUser,
    notifyOnNetworkStatusChange: true,
  });

  const reviewsResults = data?.reviewVotes?.results;
  const totalCount = data?.reviewVotes?.totalCount;

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

export default registerComponent('ReviewProgressVoting', ReviewProgressVoting, {styles});



