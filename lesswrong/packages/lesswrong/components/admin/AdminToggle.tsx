import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userIsMemberOf } from '../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import { useAdminToggle } from './useAdminToggle';

const styles = (theme: ThemeType) => ({
  toggle: {
    position: 'fixed',
    left: 20,
    bottom: 20,
    display: 'flex',
    alignItems: 'center',
    height: 36,
    width: 118,
    backgroundColor: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 600,
    padding: '0 18px',
    borderRadius: 18,
    boxShadow: theme.palette.boxShadow.eaCard,
    cursor: 'pointer',
    zIndex: theme.zIndexes.intercomButton,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    [theme.breakpoints.down('md')]: {
      left: 10,
      bottom: 58,
      height: 26,
      width: 92,
      fontSize: 11,
      padding: '0 12px',
      borderRadius: 13,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
    "@media print": {
      display: "none",
    },
  },
  toggleOff: {
    backgroundColor: theme.palette.grey[400],
    '&:hover': {
      backgroundColor: theme.palette.grey[500],
    }
  },
  toggleDisabled: {
    cursor: 'default',
  },
  onText: {
    textAlign: 'left',
  },
  offText: {
    flexGrow: 1,
    textAlign: 'right',
  },
  toggleDot: {
    position: 'absolute',
    left: 87,
    height: 26,
    width: 26,
    backgroundColor: theme.palette.text.alwaysWhite,
    borderRadius: '50%',
    // transition: 'left .2s ease',
    [theme.breakpoints.down('md')]: {
      left: 70,
      height: 18,
      width: 18,
    }
  },
  toggleDotOff: {
    left: 5,
    [theme.breakpoints.down('md')]: {
      left: 4
    }
  }
});

export const AdminToggle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const {loading, toggleOn, toggleOff} = useAdminToggle()
  
  if (!currentUser) return null

  if (currentUser.isAdmin) {
    return <div
      className={classNames(classes.toggle, {[classes.toggleDisabled]: loading})}
      onClick={loading ? undefined : toggleOff}
    >
      <div className={classes.onText}>Admin on</div>
      <div className={classes.toggleDot}></div>
    </div>
  } else if (!currentUser.isAdmin && userIsMemberOf(currentUser, "realAdmins")) {
    return <div
      className={classNames(classes.toggle, classes.toggleOff, {[classes.toggleDisabled]: loading})}
      onClick={loading ? undefined : toggleOn}
    >
      <div className={classes.offText}>Admin off</div>
      <div className={classNames(classes.toggleDot, classes.toggleDotOff)}></div>
    </div>
  }
  
  return null
}

const AdminToggleComponent = registerComponent('AdminToggle', AdminToggle, {styles});

declare global {
  interface ComponentTypes {
    AdminToggle: typeof AdminToggleComponent
  }
}

export default AdminToggleComponent;

