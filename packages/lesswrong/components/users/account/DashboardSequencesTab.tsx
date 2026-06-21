import React from 'react';
import { useCurrentUser } from '@/components/common/withUser';
import { Link } from '@/lib/reactRouterWrapper';
import SequencesGridWrapper from '../../sequences/SequencesGridWrapper';
import SectionButton from '../../common/SectionButton';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles } from '@/components/hooks/useStyles';
import { dashboardTabStyles } from './dashboardTabStyles';

const DashboardSequencesTab = ({userId}: {userId: string}) => {
  const classes = useStyles(dashboardTabStyles);
  const currentUser = useCurrentUser();
  const isOwnPage = currentUser?._id === userId;

  const draftTerms: SequencesViewTerms = {view: 'userProfileAll', userId, limit: 9};
  const publishedTerms: SequencesViewTerms = {view: 'userProfile', userId, limit: 9};

  return (
    <AnalyticsContext pageElementContext="dashboardSequencesTab">
      {/* Draft sequences section */}
      {isOwnPage && <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <div className={classes.sectionLabel}>Drafts</div>
          <Link to="/sequencesnew">
            <SectionButton>New Sequence</SectionButton>
          </Link>
        </div>
        <SequencesGridWrapper
          terms={draftTerms}
          showLoadMore
        />
      </div>}

      {isOwnPage && <div className={classes.divider} />}

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
