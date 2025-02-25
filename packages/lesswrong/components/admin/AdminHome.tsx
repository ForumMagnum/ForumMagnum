import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { hasDigests, hasForumEvents, hasSurveys, hasTwitterFeatures } from '../../lib/betas';
import { isEAForum, taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { useRefreshDbSettings } from '../hooks/useRefreshDbSettings';

// Also used in ModerationLog
export const styles = (theme: ThemeType) => ({
  adminHomeOrModerationLogPage: {
    fontFamily: theme.typography.fontFamily,
  
    "& h1": {
      ...theme.typography.display3,
    },
  
    "& h2": {
      ...theme.typography.display2,
    },
  
    "& h3": {
      ...theme.typography.display1,
      marginTop: 0,
      marginBottom: "0.5em",
    },
  },
  link: {
    color: theme.palette.primary.main,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.8,
    },
  },
});

const AdminHome = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const {SingleColumnSection, AdminMetadata, Loading} = Components;
  const currentUser = useCurrentUser();
  const {refreshDbSettings, isRefreshingDbSettings} = useRefreshDbSettings();
  
  if (!userIsAdmin(currentUser)) {
    return <SingleColumnSection>
      <p>Sorry, you do not have permission to do this at this time.</p>
    </SingleColumnSection>
  }
  
  return <SingleColumnSection>
    <div className={classes.adminHomeOrModerationLogPage}>
      <h1>Admin Console</h1>
      
      <h3>Moderation</h3>
      <ul>
        <li><Link className={classes.link} to="/admin/moderation">Moderation Dashboard</Link></li>
        <li><Link className={classes.link} to="/moderation/altAccounts">Alt-Accounts Investigator</Link></li>
        <li><Link className={classes.link} to="/admin/recentlyActiveUsers">Recently Active Users</Link></li>
        <li><Link className={classes.link} to="/admin/moderationTemplates">Moderation Templates</Link></li>
        <li><Link className={classes.link} to="/admin/modgpt">ModGPT Dashboard</Link></li>
        <li><Link className={classes.link} to="/admin/random-user">Random User</Link></li>
        <li><Link className={classes.link} to="/moderatorComments">Moderator Comments</Link></li>
        <li><Link className={classes.link} to="/moderation">Moderation Log</Link></li>
        <li><Link className={classes.link} to={`/${taggingNamePluralSetting.get()}/dashboard`}>{taggingNamePluralCapitalSetting.get()} Dashboard</Link></li>
      </ul>

      <h3>Site Admin</h3>
      <ul>
        {isEAForum && <li><Link className={classes.link} to="/admin/election-candidates">Donation Election Candidates</Link></li>}
        {hasDigests && <li><Link className={classes.link} to="/admin/digests">Digests</Link></li>}
        {hasTwitterFeatures && <li><Link className={classes.link} to="/admin/twitter">Twitter tools</Link></li>}
        <li><Link className={classes.link} to="/spotlights">Spotlights</Link></li>
        {hasSurveys && <li><Link className={classes.link} to="/admin/surveys">Surveys</Link></li>}
        {hasForumEvents &&
          <li><Link className={classes.link} to="/adminForumEvents">Forum events</Link></li>
        }
        <li><Link className={classes.link} to="/reviewAdmin">Review Admin (current year)</Link></li>
        <li><Link className={classes.link} to="/admin/migrations">Migrations</Link></li>
        <li><Link className={classes.link} to="/admin/synonyms">Search Synonyms</Link></li>
        <li><Link className={classes.link} to="/admin/tagMerge">{taggingNameCapitalSetting.get()} Merging Tool</Link></li>
        <li><Link className={classes.link} to="/admin/googleServiceAccount">Google Doc import service account</Link></li>
        <li><span className={classes.link} onClick={refreshDbSettings}>Refresh DB Settings</span></li>
        {isRefreshingDbSettings && <Loading />}
      </ul>
      
      <h3>Debug Tools</h3>
      <ul>
        <li><Link className={classes.link} to="/debug/emailHistory">Email History</Link></li>
        <li><Link className={classes.link} to="/debug/notificationEmailPreview">Notification Email Preview</Link></li>
        <li><Link className={classes.link} to="/searchTest">Search Test</Link></li>
        <li><Link className={classes.link} to="/postListEditorTest">Post List Editor Test</Link></li>
        <li><Link className={classes.link} to="/imageUpload">Image Upload Test</Link></li>
        <li><Link className={classes.link} to="/admin/recommendationsSample">Recommendations Explorer</Link></li>
        <li><Link className={classes.link} to="/admin/onboarding">View onboarding flow</Link> (for testing purposes - this will not make any changes to your account)</li>
      </ul>

      <h3>Server Information</h3>
      <AdminMetadata/>
    </div>
  </SingleColumnSection>
}

const AdminHomeComponent = registerComponent('AdminHome', AdminHome, {styles});

declare global {
  interface ComponentTypes {
    AdminHome: typeof AdminHomeComponent
  }
}
