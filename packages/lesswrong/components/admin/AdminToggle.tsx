import React, { useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { useAdminToggle } from './useAdminToggle';
import { useEAForumV3 } from './useEAForumV3';
import ToggleSwitch from '../common/ToggleSwitch';

const styles = (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    left: 20,
    bottom: 20,
    backgroundColor: `color-mix(in srgb, ${theme.palette.background.paper} 80%, transparent)`,
    borderRadius: 8,
    boxShadow: theme.palette.boxShadow.eaCard,
    padding: '12px 14px',
    zIndex: theme.zIndexes.intercomButton,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
    "@media print": {
      display: "none",
    },
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  label: {
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
});

export const AdminToggle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {loading, toggleOn, toggleOff} = useAdminToggle();
  const {preferNewSite, setPreferNewSite} = useEAForumV3();
  const isRealAdmin = userIsMemberOf(currentUser, "realAdmins");

  const handleAdminToggle = useCallback((value: boolean) => {
    if (loading) return;
    if (value) {
      toggleOn?.();
    } else {
      toggleOff?.();
    }
  }, [loading, toggleOn, toggleOff]);

  if (!currentUser || !isRealAdmin) return null;

  const isAdminOn = currentUser.isAdmin;

  return (
    <div className={classes.root}>
      <div className={classes.row}>
        <span className={classes.label}>Admin</span>
        <ToggleSwitch
          value={isAdminOn}
          setValue={handleAdminToggle}
          smallVersion
        />
      </div>
      <div className={classes.row}>
        <span className={classes.label}>Prefer new site</span>
        <ToggleSwitch
          value={preferNewSite}
          setValue={setPreferNewSite}
          smallVersion
        />
      </div>
    </div>
  );
}

export default registerComponent('AdminToggle', AdminToggle, {styles});



