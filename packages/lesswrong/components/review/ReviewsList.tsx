import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { ReviewYear } from '../../lib/reviewUtils';
import { TupleSet, UnionOf } from '../../lib/utils/typeGuardUtils';

const sortOptions = new TupleSet(["top", "new", "groupByPost"] as const);
export type ReviewSortOption = UnionOf<typeof sortOptions>;

export const ReviewsList = ({title, defaultSort, reviewYear}: {
  title: React.ReactNode | string,
  defaultSort: ReviewSortOption,
  reviewYear?: ReviewYear
}) => {
  const { RecentComments, SectionTitle} = Components
  const [sortReviews, setSortReviews ] = useState<string>(defaultSort)
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
      <RecentComments terms={{ view: "reviews", reviewYear, sortBy: sortReviews}} truncated/>
  </div>;
}

const ReviewsListComponent = registerComponent('ReviewsList', ReviewsList);

declare global {
  interface ComponentTypes {
    ReviewsList: typeof ReviewsListComponent
  }
}
