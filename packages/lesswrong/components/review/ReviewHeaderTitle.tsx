import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { getReviewShortTitle, getReviewYearFromString } from '../../lib/reviewUtils';
import { headerSubtitleStyles } from '../common/HeaderSubtitle';
import { Link } from '../../lib/reactRouterWrapper';
import { useStyles } from '../hooks/useStyles';

export const ReviewHeaderTitle = () => {
  const classes = useStyles(headerSubtitleStyles);
  const { params } = useLocation()
  const reviewYear = getReviewYearFromString(params.year)
  return <div className={classes.subtitle}>
    <Link to={`/reviewVoting/${reviewYear}`}>{getReviewShortTitle(reviewYear)} Dashboard</Link>
  </div>;
}

export default ReviewHeaderTitle;



