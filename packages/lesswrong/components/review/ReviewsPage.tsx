import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { getReviewYearFromString, reviewYears, ReviewYear, REVIEW_YEAR } from '../../lib/reviewUtils';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
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
});


export const ReviewsPageInner = ({classes, reviewYear}: {classes: ClassesType<typeof styles>, reviewYear?: ReviewYear}) => {
  const { SingleColumnSection, ReviewsList } = Components

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

export const ReviewsPage = registerComponent('ReviewsPage', ReviewsPageInner, {styles});

declare global {
  interface ComponentTypes {
    ReviewsPage: typeof ReviewsPage
  }
}

