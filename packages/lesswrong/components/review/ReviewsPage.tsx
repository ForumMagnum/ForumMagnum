import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { getReviewYearFromString } from '../../lib/reviewUtils';

export const ReviewsPage = () => {
  const { SingleColumnSection, ReviewsList } = Components

  const { params } = useLocation()
  const reviewYear = getReviewYearFromString(params.year)

  return <SingleColumnSection>
    <ReviewsList reviewYear={reviewYear} title={`Reviews ${reviewYear}`} defaultSort="top"/>
  </SingleColumnSection>;
}

const ReviewsPageComponent = registerComponent('ReviewsPage', ReviewsPage);

declare global {
  interface ComponentTypes {
    ReviewsPage: typeof ReviewsPageComponent
  }
}

