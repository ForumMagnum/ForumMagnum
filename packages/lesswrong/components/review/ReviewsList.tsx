import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { ReviewYear } from '../../lib/reviewUtils';
import { Link } from '../../lib/reactRouterWrapper';

export const ReviewsList = ({classes, reviewYear}: {
  classes: ClassesType,
  reviewYear: ReviewYear
}) => {
  const { RecentComments, SectionTitle} = Components
  const [sortReviews, setSortReviews ] = useState<string>("new")
  return <div>
      <SectionTitle title={<Link to={`/reviews`}>Reviews</Link>}>
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
