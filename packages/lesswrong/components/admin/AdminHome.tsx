import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { hasDigestSetting } from '../../lib/publicSettings';

// Also used in ModerationLog
export const styles = (theme: ThemeType): JssStyles => ({
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
  },
});

const AdminHome = ({ classes }: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, AdminMetadata } = Components;
  const currentUser = useCurrentUser();
  
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
      </ul>

      <h3>Site Admin</h3>
      <ul>
        {hasDigestSetting.get() && <li><Link className={classes.link} to="/admin/digests">Digests</Link></li>}
        <li><Link className={classes.link} to="/spotlights">Spotlights</Link></li>
        <li><Link className={classes.link} to="/reviewAdmin">Review Admin (current year)</Link></li>
        <li><Link className={classes.link} to="/admin/migrations">Migrations</Link></li>
        <li><Link className={classes.link} to="/admin/synonyms">Search Synonyms</Link></li>
      </ul>
      
      <h3>Debug Tools</h3>
      <ul>
        <li><Link className={classes.link} to="/debug/emailHistory">Email History</Link></li>
        <li><Link className={classes.link} to="/debug/notificationEmailPreview">Notification Email Preview</Link></li>
        <li><Link className={classes.link} to="/searchTest">Search Test</Link></li>
        <li><Link className={classes.link} to="/postListEditorTest">Post List Editor Test</Link></li>
        <li><Link className={classes.link} to="/imageUpload">Image Upload Test</Link></li>
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
