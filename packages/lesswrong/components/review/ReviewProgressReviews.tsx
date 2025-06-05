import React from 'react';
import { ReviewYear } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import CheckBoxOutlineBlankIcon from '@/lib/vendor/@material-ui/icons/src/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@/lib/vendor/@material-ui/icons/src/CheckBoxTwoTone';
import range from 'lodash/range';
import LWTooltip from "../common/LWTooltip";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentReviewProgressReviewsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

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
  const { data } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { reviews: { userId: currentUser?._id, reviewYear } },
      limit: TARGET_NUM,
      enableTotal: true,
    },
    skip: !currentUser,
    notifyOnNetworkStatusChange: true,
  });

  const reviewsResults = data?.comments?.results;
  const totalCount = data?.comments?.totalCount;

  if (!reviewsResults) return null

  const totalReviews = totalCount || 0
  const totalHighlightedReviews = reviewsResults.filter(review => review.baseScore && review.baseScore >= 10).length
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

export default registerComponent('ReviewProgressReviews', ReviewProgressReviews, {styles});



