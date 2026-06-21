import React, { useState } from 'react';
import classNames from 'classnames';
import CommentsDraftList from '../../comments/CommentsDraftList';
import RecentComments from '../../comments/RecentComments';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';

const styles = defineStyles('DashboardCommentsTab', (theme: ThemeType) => ({
  filterRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 12,
  },
  filterButton: {
    background: 'none',
    border: 'none',
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
  filterButtonActive: {
    color: theme.palette.grey[900],
    fontWeight: 600,
  },
}));

type CommentFilter = 'all' | 'quickTakes' | 'regular';

function getCommentSelector(userId: string, filter: CommentFilter): CommentSelector {
  const base = {
    authorIsUnreviewed: null,
    userId,
  };

  switch (filter) {
    case 'quickTakes':
      return { profileComments: { ...base, shortform: true } };
    case 'regular':
      return { profileComments: { ...base, shortform: false } };
    case 'all':
    default:
      return { profileComments: base };
  }
}

const DashboardCommentsTab = ({userId}: {userId: string}) => {
  const shared = useStyles(dashboardTabStyles);
  const classes = useStyles(styles);
  const [filter, setFilter] = useState<CommentFilter>('all');

  return (
    <AnalyticsContext pageElementContext="dashboardCommentsTab">
      {/* Draft comments section */}
      <div className={shared.section}>
        <div className={shared.sectionHeader}>
          <div className={shared.sectionLabel}>Drafts</div>
        </div>
        <CommentsDraftList
          userId={userId}
          initialLimit={10}
          silentIfEmpty
        />
      </div>

      <div className={shared.divider} />

      {/* Published comments section */}
      <div className={shared.section}>
        <div className={shared.sectionHeader}>
          <div className={shared.sectionLabel}>Published</div>
        </div>
        <div className={classes.filterRow}>
          {(['all', 'quickTakes', 'regular'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={classNames(classes.filterButton, filter === f && classes.filterButtonActive)}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'quickTakes' ? 'Quick Takes' : 'Comments'}
            </button>
          ))}
        </div>
        <RecentComments
          selector={getCommentSelector(userId, filter)}
          limit={10}
        />
      </div>
    </AnalyticsContext>
  );
};

export default DashboardCommentsTab;
