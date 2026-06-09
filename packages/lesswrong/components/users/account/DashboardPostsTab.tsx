import React, { useMemo, useState } from 'react';
import { useCurrentUser } from '@/components/common/withUser';
import { useLocation } from '@/lib/routeUtil';
import { Link } from '@/lib/reactRouterWrapper';
import { userCanPost } from '@/lib/collections/users/helpers';
import { POST_SORTING_MODES } from '@/lib/collections/posts/views';
import { getSortOrderOptions } from '@/lib/collections/posts/dropdownOptions';
import DraftsList from '../../posts/DraftsList';
import PostsList2 from '../../posts/PostsList2';
import SettingsButton from '../../icons/SettingsButton';
import PostsListSettings, { postListSettingUrlParameterNames } from '../../posts/PostsListSettings';
import SectionButton from '../../common/SectionButton';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';
import pick from 'lodash/pick';

const DashboardPostsTab = ({userId}: {userId: string}) => {
  const classes = useStyles(dashboardTabStyles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  const postQueryMode = query.sortedBy || query.view || 'new';
  const currentPostSortingMode = POST_SORTING_MODES.has(postQueryMode) ? postQueryMode : 'new';

  const postTerms: PostsViewTerms = useMemo(() => ({
    view: 'userPosts',
    ...pick(query, postListSettingUrlParameterNames),
    userId,
    authorIsUnreviewed: null,
    sortedBy: currentPostSortingMode,
    excludeEvents: query.includeEvents !== 'true' && (query.filter || 'all') !== 'events',
  }), [userId, query, currentPostSortingMode]);

  return (
    <AnalyticsContext pageElementContext="dashboardPostsTab">
      {/* Drafts section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Drafts</div>
          {currentUser && userCanPost(currentUser) && (
            <Link to="/newPost">
              <SectionButton>
                <DescriptionIcon /> New Post
              </SectionButton>
            </Link>
          )}
        </div>
        <DraftsList
          limit={20}
          userId={userId}
          hideHeaderRow
          showAllDraftsLink={false}
        />
      </div>

      <div className={classes.divider} />

      {/* Published section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Published</div>
          <div onClick={() => setShowSettings(!showSettings)}>
            <SettingsButton label={`Sorted by ${getSortOrderOptions()[currentPostSortingMode].label}`} />
          </div>
        </div>
        {showSettings && <PostsListSettings
          hidden={false}
          currentSorting={currentPostSortingMode}
          currentFilter={query.filter || 'all'}
          currentShowLowKarma={false}
          currentIncludeEvents={query.includeEvents === 'true'}
        />}
        <PostsList2
          terms={postTerms}
          hideAuthor
        />
      </div>
    </AnalyticsContext>
  );
};

export default DashboardPostsTab;
