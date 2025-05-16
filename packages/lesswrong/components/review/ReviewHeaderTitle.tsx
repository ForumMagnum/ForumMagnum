import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { getReviewShortTitle, getReviewYearFromString } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { styles } from '../common/HeaderSubtitle';
import { Link } from '../../lib/reactRouterWrapper';

export const ReviewHeaderTitle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { params } = useLocation()
  const reviewYear = getReviewYearFromString(params.year)
  return <div className={classes.subtitle}>
    <Link to={`/reviewVoting/${reviewYear}`}>{getReviewShortTitle(reviewYear)} Dashboard</Link>
  </div>;
}

export default registerComponent('ReviewHeaderTitle', ReviewHeaderTitle, {styles});



