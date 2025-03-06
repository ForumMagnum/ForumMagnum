import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { ReviewYear } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import range from 'lodash/range';
import LWTooltip from "@/components/common/LWTooltip";

const styles = (theme: ThemeType) => ({
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
    color: theme.palette.grey[600],
  },
  extraIcon: {
    width: 22,
    color: theme.palette.primary.light,
  },
  highlightedIcon: {
    color: theme.palette.primary.main,
  }
});

export const ReviewProgressReviews = ({classes, reviewYear}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear
}) => {
  const TARGET_NUM = 3

  const currentUser = useCurrentUser()
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
  const totalHighlightedReviews = reviewsResults.filter(review => review.baseScore >= 10).length
  const reviewCountMessage = totalHighlightedReviews ? `(${totalHighlightedReviews} of your reviews got 10+ karma)` : "(None with 10+ karma yet)"

  const uncheckedBoxes = TARGET_NUM - Math.min(totalReviews, TARGET_NUM)

  return <LWTooltip title={<div>
      {totalReviews < TARGET_NUM &&
      <div>Help inform voters by writing {TARGET_NUM} reviews. Reviews with 10+ karma will appear on the Best of LessWrong page.</div>}
      <p><em>{totalReviews ? `You've written ${totalReviews} review${totalReviews === 1 ? "" : "s"}${totalReviews >= TARGET_NUM ? "!" : "."} ${reviewCountMessage}` : "You haven't written any reviews yet."}</em></p>
    </div>} placement="top">
    <div className={classes.root}>
      {reviewsResults.map(review => {
        return <CheckBoxTwoToneIcon className={classes.filledIcon} key={review._id}/>
      })}
      {range(0, uncheckedBoxes).map(a => <CheckBoxOutlineBlankIcon className={classes.icon} key={`${currentUser?._id}`}/>) }
    </div>
  </LWTooltip>
}

const ReviewProgressReviewsComponent = registerComponent('ReviewProgressReviews', ReviewProgressReviews, {styles});

declare global {
  interface ComponentTypes {
    ReviewProgressReviews: typeof ReviewProgressReviewsComponent
  }
}

export default ReviewProgressReviewsComponent;

