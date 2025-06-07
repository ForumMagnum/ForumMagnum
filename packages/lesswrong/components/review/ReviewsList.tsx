import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import { ReviewYear } from '../../lib/reviewUtils';
import { TupleSet, UnionOf } from '../../lib/utils/typeGuardUtils';
import sortBy from 'lodash/sortBy';
import { Typography } from "../common/Typography";
import CommentsNodeInner from "../comments/CommentsNode";
import SectionTitle from "../common/SectionTitle";
import ReviewsLeaderboard from "./ReviewsLeaderboard";
import Loading from "../vulcan-core/Loading";
import { MenuItem } from "../common/Menus";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentReviewsListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
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
    padding: 16,
    paddingTop: 0,
    marginTop: -24,
    backgroundColor: theme.palette.background.translucentBackground
  }
})

const sortOptions = new TupleSet(["top", "new"] as const);
export type ReviewSortOption = UnionOf<typeof sortOptions>;

export const ReviewsList = ({classes, title, defaultSort, reviewYear}: {
  classes: ClassesType<typeof styles>,
  title: React.ReactNode | string,
  defaultSort: ReviewSortOption,
  reviewYear?: ReviewYear
}) => {
  const [sortReviews, setSortReviews ] = useState<string>(defaultSort)
  
  const { data, loading } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { reviews: { reviewYear, sortBy: "new" } },
      limit: 1000,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const reviews = data?.comments?.results;
  const sortedReviews = sortBy(reviews, obj => {
    if (sortReviews === "top") return -(obj.baseScore ?? 0)
    if (sortReviews === "new") return -obj.postedAt 
  })
  
  return <div className={classes.root}>
        <SectionTitle title={title}>
          <Select
            value={sortReviews}
            onChange={(e)=>setSortReviews(e.target.value)}
            disableUnderline
            >
            <MenuItem value={'top'}>Sorted by Top</MenuItem>
            <MenuItem value={'new'}>Sorted by New</MenuItem>
          </Select>
        </SectionTitle>
        {reviews && <ReviewsLeaderboard reviews={reviews} reviewYear={reviewYear} />}
      {!loading && reviews && !reviews.length && <Typography variant="body2">   
        No Reviews Found
      </Typography>}
      {(loading) && <Loading />}
      {sortedReviews.map(comment =>
        <div key={comment._id} id={comment._id}>
          <CommentsNodeInner
            treeOptions={{
              condensed: false,
              post: comment.post ?? undefined,
              tag: comment.tag ?? undefined,
              showPostTitle: true,
              forceNotSingleLine: true
            }}
            comment={comment}
            startThreadTruncated={true}
          />
        </div>
      )}
  </div>;
}

export default registerComponent('ReviewsList', ReviewsList, {styles});


