import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { getReviewShortTitle, getReviewYearFromString } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { styles } from '../common/HeaderSubtitle';
import { Link } from '../../lib/reactRouterWrapper';

export const ReviewHeaderTitleInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { params } = useLocation()
  const reviewYear = getReviewYearFromString(params.year)
  return <div className={classes.subtitle}>
    <Link to={`/reviewVoting/${reviewYear}`}>{getReviewShortTitle(reviewYear)} Dashboard</Link>
  </div>;
}

export const ReviewHeaderTitle = registerComponent('ReviewHeaderTitle', ReviewHeaderTitleInner, {styles});

declare global {
  interface ComponentTypes {
    ReviewHeaderTitle: typeof ReviewHeaderTitle
  }
}

