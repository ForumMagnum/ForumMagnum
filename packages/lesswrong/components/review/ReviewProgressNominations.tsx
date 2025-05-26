import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { REVIEW_YEAR, ReviewYear } from '@/lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import range from 'lodash/range';
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentReviewProgressNominationsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
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
  const { data } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { reviews: { userId: currentUser?._id, reviewYear } },
      limit: TARGET_REVIEWS_NUM,
      enableTotal: true,
    },
    skip: !currentUser,
    notifyOnNetworkStatusChange: true,
  });

  const reviewsResults = data?.comments?.results;
  const reviewsTotalCount = data?.comments?.totalCount;

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

export default registerComponent('ReviewProgressNominations', ReviewProgressNominations, {styles});


