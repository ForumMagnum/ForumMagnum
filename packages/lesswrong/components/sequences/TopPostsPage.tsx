import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { SORT_ORDER_OPTIONS } from '../../lib/collections/posts/dropdownOptions';

import Tooltip from '@material-ui/core/Tooltip';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';

export type LWReviewWinnerSortOrder = 'curated' | 'ranking' | 'year';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    cursor: "pointer",
    "& .SectionTitle-title": isFriendlyUI
      ? {
        color: theme.palette.grey[1000],
        textTransform: "none",
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "0",
        lineHeight: "34px",
      }
      : {},
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
});

// TODO: update the description to be appropriate for this page
const description = `All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`;

const formatSort = (sorting: PostSortingMode) => {
  const sort = SORT_ORDER_OPTIONS[sorting].label
  return isFriendlyUI ? sort : `Sorted by ${sort}`;
}

const getReviewWinnerResolverName = (sortOrder: LWReviewWinnerSortOrder) => {
  switch (sortOrder) {
    case 'curated':
      return 'ReviewWinnersCuratedOrder';
    case 'ranking':
      return 'ReviewWinnersRankingOrder';
    case 'year':
      return 'ReviewWinnersYearOrder';
  }
};

const TopPostsPage = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser();
  const {query} = useLocation();
  const [sortOrder, setSortOrder] = useState<LWReviewWinnerSortOrder>('curated');

  const {
    SingleColumnSection, SectionTitle, SortButton, SettingsButton, PostsListSettings, HeadTags,
    PostsList2
  } = Components;

  const resolverName = getReviewWinnerResolverName(sortOrder);

  return (
    <>
      <HeadTags description={description} />
      {/** TODO: change pageContext when/if we rename component */}
      <AnalyticsContext pageContext="topPostsPage">
        <SingleColumnSection>
          <PostsList2
            terms={{ limit: 20 }}
            resolverName={resolverName}
          />
          {/** TODO: posts list goes here */}
        </SingleColumnSection>
      </AnalyticsContext>
    </>
  );
}

const TopPostsPageComponent = registerComponent(
  "TopPostsPage",
  TopPostsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    TopPostsPage: typeof TopPostsPageComponent
  }
}
