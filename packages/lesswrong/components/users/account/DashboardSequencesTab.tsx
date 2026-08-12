import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import SequencesGridWrapper from '../../sequences/SequencesGridWrapper';
import SectionButton from '../../common/SectionButton';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';

const DashboardSequencesTab = ({userId, isOwnAccount}: {userId: string, isOwnAccount: boolean}) => {
  const classes = useStyles(dashboardTabStyles);

  const draftTerms: SequencesViewTerms = {view: 'userProfilePrivate', userId, limit: 9};
  const publishedTerms: SequencesViewTerms = {view: 'userProfile', userId, limit: 9};

  return (
    <AnalyticsContext pageElementContext="dashboardSequencesTab">
      {/* Draft sequences section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Drafts</div>
          {isOwnAccount && <Link to="/sequencesnew">
            <SectionButton>New Sequence</SectionButton>
          </Link>}
        </div>
        <SequencesGridWrapper
          terms={draftTerms}
          showLoadMore
        />
      </div>

      <div className={classes.divider} />

      {/* Published sequences section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Published</div>
        </div>
        <SequencesGridWrapper
          terms={publishedTerms}
          showLoadMore
        />
      </div>
    </AnalyticsContext>
  );
};

export default DashboardSequencesTab;
