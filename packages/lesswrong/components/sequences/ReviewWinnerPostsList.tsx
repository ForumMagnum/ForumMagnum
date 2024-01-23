// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { usePostsList } from '../posts/usePostsList';

export type LWReviewWinnerSortOrder = 'curated' | 'ranking' | 'year';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const getReviewWinnerResolverName = (sortOrder: LWReviewWinnerSortOrder) => {
  switch (sortOrder) {
    case 'curated':
      return 'ReviewWinnersCuratedOrder';
    case 'ranking':
      return 'ReviewWinnersRankingOrder';
    case 'year':
      return 'ReviewWinnersYearOrder';
  }
}

export const ReviewWinnerPostsList = ({ sortOrder, classes }: {
  sortOrder: LWReviewWinnerSortOrder,
  classes: ClassesType<typeof styles>,
}) => {
  const resolverName = getReviewWinnerResolverName(sortOrder);
  usePostsList({
    terms: { limit: 20 },
    resolverName,
    
  })
  // const { results, loading, loadMore, loadMoreProps } = usePaginatedResolver({
  //   resolverName,
  //   fragmentName: 'PostsListWithVotes',
  //   limit: 20,

  // });

  return <div className={classes.root}>

  </div>;
}

const ReviewWinnerPostsListComponent = registerComponent('ReviewWinnerPostsList', ReviewWinnerPostsList, {styles});

declare global {
  interface ComponentTypes {
    ReviewWinnerPostsList: typeof ReviewWinnerPostsListComponent
  }
}
