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

const TopPostsPage = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser();
  const {query} = useLocation();

  const {
    SingleColumnSection, SectionTitle, SortButton, SettingsButton, PostsListSettings, HeadTags,
    AllPostsList,
  } = Components;

  return (
    <>
      <HeadTags description={description} />
      {/** TODO: change pageContext when/if we rename component */}
      <AnalyticsContext pageContext="topPostsPage">
        <SingleColumnSection>
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
