import React from 'react';
import LocalGroupsList from '../../localGroups/LocalGroupsList';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';

const DashboardGroupsTab = ({userId}: {userId: string}) => {
  const classes = useStyles(dashboardTabStyles);

  return (
    <AnalyticsContext pageElementContext="dashboardGroupsTab">
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Organizer of</div>
        </div>
        <LocalGroupsList
          view="userActiveGroups"
          terms={{userId}}
          limit={300}
          showNoResults={false}
        />
      </div>

      <div className={classes.divider} />

      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Inactive groups</div>
        </div>
        <LocalGroupsList
          view="userInactiveGroups"
          terms={{userId}}
          showNoResults={false}
        />
      </div>
    </AnalyticsContext>
  );
};

export default DashboardGroupsTab;
