import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { getReviewYearFromString, reviewYears, ReviewYear, REVIEW_YEAR } from '../../lib/reviewUtils';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import SingleColumnSection from "../common/SingleColumnSection";
import ReviewsList from "./ReviewsList";
import { useStyles } from '../hooks/useStyles';
import { defineStyles } from '../hooks/defineStyles';

const styles = defineStyles("ReviewsPage", (theme: ThemeType) => ({
  yearLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 14,
    padding: 16,
    backgroundColor: theme.palette.background.translucentBackground
  },
  yearLink: {
    ...theme.typography.body2,
    fontSize: theme.typography.body1.fontSize,
    color: theme.palette.grey[500],
    marginRight: 14,
    '&:hover': {
      opacity: .5
    }
  },
  selected: {
    color: theme.palette.grey[900]
  }
}));


export const ReviewsPage = ({reviewYear}: {reviewYear?: ReviewYear}) => {
  const classes = useStyles(styles);
  const { params } = useLocation()

  if (params.year !== 'all') {
    reviewYear = getReviewYearFromString(params.year)
  }

  const defaultSort = reviewYear === REVIEW_YEAR ? 'new' : 'top'

  return <SingleColumnSection>
    <div className={classes.yearLinks}>
      {[...reviewYears].map(year => <Link className={classNames(classes.yearLink, {[classes.selected]: year === reviewYear})} to={`/reviews/${year}`} key={year}>
        {year}
      </Link>)}
    </div>
    <ReviewsList reviewYear={reviewYear ?? undefined} title={`Reviews ${reviewYear ?? "(All Years)"}`} defaultSort={defaultSort}/>
  </SingleColumnSection>;
}

export default ReviewsPage;



