import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { ReviewYear } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import range from 'lodash/range';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  text: {
    ...theme.typography.body2,
    marginLeft: 10,
    color: theme.palette.grey[600],
    fontSize: "1rem"
  },
  icon: {
    width: 20,
    color: theme.palette.grey[500]
  },
  filledIcon: {
    width: 20,
    color: theme.palette.primary.main,
  },
  extraIcon: {
    width: 22,
    color: theme.palette.primary.light,
  }
});

export const UserReviewsProgressBar = ({classes, reviewYear}: {
  classes: ClassesType,
  reviewYear: ReviewYear
}) => {
  const TARGET_NUM = 3

  const currentUser = useCurrentUser()

  const { LWTooltip } = Components

  const { results: reviewsResults, totalCount } = useMulti({
    terms: {
      view: "reviews",
      userId: currentUser?._id,
      reviewYear
    },
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: true,
    skip: !currentUser,
    limit: TARGET_NUM
  });

  if (!reviewsResults) return null

  const totalReviews = totalCount || 0

  const uncheckedBoxes = TARGET_NUM - Math.min(totalReviews, TARGET_NUM)

  return <LWTooltip title={<div>
      <p><em>{totalReviews ? `You've written ${totalReviews} reviews${totalReviews >= TARGET_NUM ? "!" : "."}` : "You haven't written any reviews yet."}</em></p>
      {totalReviews < TARGET_NUM && <>
      <div>It'd be helpful if you did {TARGET_NUM} reviews! They can be short!</div>
      <div>If they're especially good, the LessWrong team will give you a $50-$500 prize.</div></>}
    </div>} placement="top">
    <div className={classes.root}>
      {reviewsResults.map(review => {
        return <CheckBoxTwoToneIcon className={classes.filledIcon} key={review._id}/>
      })}
      {range(0, uncheckedBoxes).map(a => <CheckBoxOutlineBlankIcon className={classes.icon} key={`${currentUser?._id}`}/>) }
    </div>
  </LWTooltip>
}

const UserReviewsProgressBarComponent = registerComponent('UserReviewsProgressBar', UserReviewsProgressBar, {styles});

declare global {
  interface ComponentTypes {
    UserReviewsProgressBar: typeof UserReviewsProgressBarComponent
  }
}

