import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { useCurrentUser } from '@/components/common/withUser';
import { useLocation } from '@/lib/routeUtil';
import { Link, QueryLink } from '@/lib/reactRouterWrapper';
import { userCanPost } from '@/lib/collections/users/helpers';
import { POST_SORTING_MODES } from '@/lib/collections/posts/views';
import { getSortOrderOptions } from '@/lib/collections/posts/dropdownOptions';
import DraftsList from '../../posts/DraftsList';
import PostsList2 from '../../posts/PostsList2';
import SettingsButton from '../../icons/SettingsButton';
import SectionButton from '../../common/SectionButton';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';

const styles = defineStyles('DashboardPostsTab', (theme: ThemeType) => ({
  sortPanel: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  sortOption: {
    padding: '4px 0',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    transition: 'color 0.12s ease',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  sortOptionActive: {
    color: theme.palette.grey[900],
    fontWeight: 600,
  },
  includeEvents: {
    marginLeft: 12,
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    padding: '0 6px 0 0',
  },
}));

const DashboardPostsTab = ({userId, isOwnAccount}: {userId: string, isOwnAccount: boolean}) => {
  const classes = useStyles(dashboardTabStyles);
  const localClasses = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const [showSortSettings, setShowSortSettings] = useState(false);

  const postQueryMode = query.sortedBy || 'new';
  const currentPostSortingMode = POST_SORTING_MODES.has(postQueryMode) ? postQueryMode : 'new';
  const includeEvents = query.includeEvents === 'true';
  const sortOptions = getSortOrderOptions();

  const postTerms: PostsViewTerms = useMemo(() => ({
    view: 'userPosts',
    userId,
    authorIsUnreviewed: null,
    sortedBy: currentPostSortingMode,
    excludeEvents: !includeEvents,
  }), [userId, currentPostSortingMode, includeEvents]);

  return (
    <AnalyticsContext pageElementContext="dashboardPostsTab">
      {/* Drafts section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Drafts</div>
          {isOwnAccount && currentUser && userCanPost(currentUser) && (
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
          <SettingsButton
            label={`Sorted by ${sortOptions[currentPostSortingMode].label}`}
            onClick={() => setShowSortSettings(!showSortSettings)}
          />
        </div>
        {showSortSettings && <div className={localClasses.sortPanel}>
          {Array.from(POST_SORTING_MODES).map((mode) => (
            <QueryLink
              key={mode}
              query={{sortedBy: mode}}
              merge
              scroll={false}
              className={classNames(localClasses.sortOption, mode === currentPostSortingMode && localClasses.sortOptionActive)}
            >
              {sortOptions[mode].label}
            </QueryLink>
          ))}
          <QueryLink
            query={{includeEvents: includeEvents ? undefined : 'true'}}
            merge
            scroll={false}
            className={classNames(localClasses.sortOption, localClasses.includeEvents, includeEvents && localClasses.sortOptionActive)}
          >
            <Checkbox classes={{root: localClasses.checkbox}} checked={includeEvents} />
            Include events
          </QueryLink>
        </div>}
        <PostsList2
          terms={postTerms}
          hideAuthor
        />
      </div>
    </AnalyticsContext>
  );
};

export default DashboardPostsTab;
