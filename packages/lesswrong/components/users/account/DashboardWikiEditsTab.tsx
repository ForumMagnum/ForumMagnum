import React from 'react';
import TagEditsByUser from '../../tagging/TagEditsByUser';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';

const DashboardWikiEditsTab = ({userId}: {userId: string}) => {
  const classes = useStyles(dashboardTabStyles);

  return (
    <AnalyticsContext pageElementContext="dashboardWikiEditsTab">
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Wiki Edits</div>
        </div>
        <TagEditsByUser userId={userId} limit={20} />
      </div>
    </AnalyticsContext>
  );
};

export default DashboardWikiEditsTab;
