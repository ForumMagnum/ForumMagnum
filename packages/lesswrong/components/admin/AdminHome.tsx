"use client";

import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useRefreshDbSettings } from '../hooks/useRefreshDbSettings';
import SingleColumnSection from "../common/SingleColumnSection";
import AdminMetadata from "./AdminMetadata";
import Loading from "../vulcan-core/Loading";
import { useStyles } from '../hooks/useStyles';
import { defineStyles } from '../hooks/defineStyles';

const styles = defineStyles("AdminHome", (theme: ThemeType) => ({
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
}));

const AdminHome = () => {
  const classes = useStyles(styles);
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
        <li><Link className={classes.link} to="/admin/supermod">Supermod</Link></li>
        <li><Link className={classes.link} to="/admin/moderation">Moderation Dashboard (legacy)</Link></li>
        <li><Link className={classes.link} to="/moderation/altAccounts">Alt-Accounts Investigator</Link></li>
        <li><Link className={classes.link} to="/admin/recentlyActiveUsers">Recently Active Users</Link></li>
        <li><Link className={classes.link} to="/admin/moderationTemplates">Moderation Templates</Link></li>
        <li><Link className={classes.link} to="/admin/random-user">Random User</Link></li>
        <li><Link className={classes.link} to="/moderatorComments">Moderator Comments</Link></li>
        <li><Link className={classes.link} to="/moderation">Moderation Log</Link></li>
        <li><Link className={classes.link} to={`/w/dashboard`}>Wikitags Dashboard</Link></li>
      </ul>

      <h3>Site Admin</h3>
      <ul>
        <li><Link className={classes.link} to="/spotlights">Spotlights</Link></li>
        <li><Link className={classes.link} to="/admin/emailSender">Email Sender</Link></li>
        <li><Link className={classes.link} to="/reviewAdmin">Review Admin (current year)</Link></li>
        <li><Link className={classes.link} to="/admin/migrations">Migrations</Link></li>
        <li><Link className={classes.link} to="/admin/synonyms">Search Synonyms</Link></li>
        <li><Link className={classes.link} to="/admin/tagMerge">Wikitag Merging Tool</Link></li>
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
        <li><Link className={classes.link} to="/admin/debugDatabaseDifferences">Debug database differences</Link></li>
      </ul>

      <h3>Server Information</h3>
      <AdminMetadata/>
    </div>
  </SingleColumnSection>
}

export default AdminHome;


