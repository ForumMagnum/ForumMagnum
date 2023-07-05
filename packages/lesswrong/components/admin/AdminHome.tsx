import React from 'react';
import { Components, registerComponent, addAdminColumn } from '../../lib/vulcan-lib';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

// Also used in ModerationLog
export const styles = (theme: ThemeType): JssStyles => ({
  adminHomeLayout: {
    width: 920,
    margin: "auto",
  },
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
});

const AdminHome = ({ classes }: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, AdminMetadata } = Components;
  const currentUser = useCurrentUser();
  
  if (!userIsAdmin(currentUser)) {
    return (
      <div className={classes.adminHomeOrModerationLogPage}>
        <p className="admin-home-message">Sorry, you do not have permission to do this at this time.</p>
      </div>
    );
  }
  
  return (
    <div className={classes.adminHomeOrModerationLogPage}>
      <div className={classes.adminHomeLayout}>
        <h1>Admin Console</h1>
        <div>
          <AdminMetadata/>
        </div>
      </div>
    </div>
  )
}

const AdminHomeComponent = registerComponent('AdminHome', AdminHome, {styles});

declare global {
  interface ComponentTypes {
    AdminHome: typeof AdminHomeComponent
  }
}
