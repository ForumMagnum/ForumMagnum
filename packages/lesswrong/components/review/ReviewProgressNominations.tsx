import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { REVIEW_YEAR, ReviewYear } from '@/lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '@/lib/crud/withMulti';
import range from 'lodash/range';


const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    marginRight: 4
  },
  reviewIcon: {
    width: 12,
    height: 12,
    backgroundColor: theme.palette.primary.light,
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 2,
    marginLeft: 14,
    transform: "rotate(45deg)"
  },
  emptyReviewIcon: {
    width: 12,
    height: 12,
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: 2,
    marginLeft: 14,
    transform: "rotate(45deg)"
  }
});

const TARGET_REVIEWS_NUM = 2

export const ReviewProgressNominations = ({classes, reviewYear = REVIEW_YEAR}: {
    classes: ClassesType<typeof styles>,
    reviewYear: ReviewYear
  }) => {

    const currentUser = useCurrentUser()

    const { LWTooltip, ForumIcon } = Components

    const { results: reviewsResults, totalCount: reviewsTotalCount } = useMulti({
      terms: {
        view: "reviews",
        userId: currentUser?._id,
        reviewYear
      },
      collectionName: "Comments",
      fragmentName: 'CommentsListWithParentMetadata',
      enableTotal: true,
      skip: !currentUser,
      limit: TARGET_REVIEWS_NUM
    });

    const totalReviews = reviewsTotalCount ?? 0

    const uncheckedReviews = TARGET_REVIEWS_NUM - Math.min(totalReviews, TARGET_REVIEWS_NUM)

    const reviewsTooltip = <div>
      {totalReviews < TARGET_REVIEWS_NUM && <>
        <div>It'll help if you write {TARGET_REVIEWS_NUM} short reviews about why a post was valuable to you.</div>
      </>}
      <p><em>{totalReviews ? `You've written ${totalReviews} review${totalReviews !== 1 ? "s" : ""}${totalReviews >= TARGET_REVIEWS_NUM ? "!" : "."}` : "You haven't written any reviews yet."}</em></p>
    </div>

    return <LWTooltip title={reviewsTooltip} placement="top">
        <div className={classes.root}>
          {reviewsResults?.map(review => {
          return <div className={classes.reviewIcon} key={review._id}/>
        })}
        {range(0, uncheckedReviews).map(a => <div className={classes.emptyReviewIcon} key={a}/>) }
        </div>
      </LWTooltip>
}

const ReviewProgressNominationsComponent = registerComponent('ReviewProgressNominations', ReviewProgressNominations, {styles});

declare global {
  interface ComponentTypes {
    ReviewProgressNominations: typeof ReviewProgressNominationsComponent
  }
}
