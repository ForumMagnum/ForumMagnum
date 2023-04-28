import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { getReviewYearFromString, reviewYears, ReviewYear, REVIEW_YEAR } from '../../lib/reviewUtils';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  yearLink: {
    ...theme.typography.body2,
    fontSize: theme.typography.body1.fontSize,
    marginBottom: 14,
    color: theme.palette.grey[500],
    marginRight: 14,
    '&:hover': {
      opacity: .5
    }
  },
  selected: {
    color: theme.palette.grey[900]
  }
});


export const ReviewsPage = ({classes}:{classes: ClassesType}) => {
  const { SingleColumnSection, ReviewsList } = Components

  const { params } = useLocation()

  let reviewYear: ReviewYear|undefined
  if (params.year !== 'all') {
    reviewYear = getReviewYearFromString(params.year)
  }

  const defaultSort = reviewYear === REVIEW_YEAR ? 'new' : 'top'

  return <SingleColumnSection>
    <div>
      <Link className={classNames(classes.yearLink, {[classes.selected]: "all" === params.year})} to="/reviews/all">All</Link>
      {reviewYears.map(year => <Link className={classNames(classes.yearLink, {[classes.selected]: year === reviewYear})} to={`/reviews/${year}`} key={year}>
        {year}
      </Link>)}
    </div>
    <ReviewsList reviewYear={reviewYear ?? undefined} title={`Reviews ${reviewYear ?? "(All Years)"}`} defaultSort={defaultSort}/>
  </SingleColumnSection>;
}

const ReviewsPageComponent = registerComponent('ReviewsPage', ReviewsPage, {styles});

declare global {
  interface ComponentTypes {
    ReviewsPage: typeof ReviewsPageComponent
  }
}

