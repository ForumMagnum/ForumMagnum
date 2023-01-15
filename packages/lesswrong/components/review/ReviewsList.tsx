import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { ReviewYear } from '../../lib/reviewUtils';
import { TupleSet, UnionOf } from '../../lib/utils/typeGuardUtils';
import { useMulti } from '../../lib/crud/withMulti';

const sortOptions = new TupleSet(["top", "new", "groupByPost"] as const);
export type ReviewSortOption = UnionOf<typeof sortOptions>;

export const ReviewsList = ({title, defaultSort, reviewYear}: {
  title: React.ReactNode | string,
  defaultSort: ReviewSortOption,
  reviewYear?: ReviewYear
}) => {
  const { CommentsNode, SectionTitle, ReviewsLeaderboard, Loading } = Components
  const [sortReviews, setSortReviews ] = useState<string>(defaultSort)
  
  const { loadingInitial, loading, results: reviews } = useMulti({
    terms: { 
      view: "reviews", 
      reviewYear,
       sortBy: sortReviews
    },
    limit: 1000,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
  });
  
  return <div>
      <SectionTitle title={title}>
        <Select
          value={sortReviews}
          onChange={(e)=>setSortReviews(e.target.value)}
          disableUnderline
          >
          <MenuItem value={'top'}>Sorted by Top</MenuItem>
          <MenuItem value={'new'}>Sorted by New</MenuItem>
          <MenuItem value={'groupByPost'}>Grouped by Post</MenuItem>
        </Select>
      </SectionTitle>
      {reviews && <ReviewsLeaderboard reviews={reviews} reviewYear={reviewYear} />}
      {loading && <Loading/>}
      {!loadingInitial && reviews && !reviews.length && <Components.Typography variant="body2">   
        No Reviews Found
      </Components.Typography>}
      {loadingInitial || !reviews && <Components.Loading />}
      {reviews?.map(comment =>
      <div key={comment._id} id={comment._id}>
        <CommentsNode
          treeOptions={{
            condensed: false,
            post: comment.post || undefined,
            tag: comment.tag || undefined,
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

const ReviewsListComponent = registerComponent('ReviewsList', ReviewsList);

declare global {
  interface ComponentTypes {
    ReviewsList: typeof ReviewsListComponent
  }
}
