import React, { useMemo } from 'react';
import classNames from 'classnames';
import { useCurrentUser } from '@/components/common/withUser';
import { useLocation } from '@/lib/routeUtil';
import { Link, QueryLink } from '@/lib/reactRouterWrapper';
import { userCanPost } from '@/lib/collections/users/helpers';
import DraftsList from '../../posts/DraftsList';
import PostsList2 from '../../posts/PostsList2';
import SectionButton from '../../common/SectionButton';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';
import PostsListSortDropdown from '../../posts/PostsListSortDropdown';

/** The dashboard offers a deliberately small subset of the post sort orders */
const DASHBOARD_SORT_ORDERS = ['new', 'top', 'old'];

const styles = defineStyles('DashboardPostsTab', (theme: ThemeType) => ({
  sortControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  includeEvents: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    transition: 'color 0.12s ease',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  includeEventsActive: {
    color: theme.palette.grey[900],
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

  const sortedByQuery = query.sortedBy;
  const currentPostSortingMode: PostSortingMode = (sortedByQuery === 'top' || sortedByQuery === 'old')
    ? sortedByQuery
    : 'new';
  const includeEvents = query.includeEvents === 'true';

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
          limit={5}
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
          <div className={localClasses.sortControls}>
            <QueryLink
              query={{includeEvents: includeEvents ? undefined : 'true'}}
              merge
              scroll={false}
              className={classNames(localClasses.includeEvents, includeEvents && localClasses.includeEventsActive)}
            >
              <Checkbox classes={{root: localClasses.checkbox}} checked={includeEvents} />
              Include events
            </QueryLink>
            <PostsListSortDropdown value={currentPostSortingMode} options={DASHBOARD_SORT_ORDERS} />
          </div>
        </div>
        <PostsList2
          terms={postTerms}
          hideAuthor
        />
      </div>
    </AnalyticsContext>
  );
};

export default DashboardPostsTab;
