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

export const SiteToggle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {loading, toggleOn, toggleOff} = useAdminToggle();
  const {preferNewSite, setPreferNewSite, showNewSiteToggle} = useEAForumV3();
  const isRealAdmin = userIsMemberOf(currentUser, "realAdmins");

  const handleAdminToggle = useCallback((value: boolean) => {
    if (loading) return;
    if (value) {
      toggleOn?.();
    } else {
      toggleOff?.();
    }
  }, [loading, toggleOn, toggleOff]);

  const showAdminToggle = isRealAdmin && currentUser;

  if (!showAdminToggle && !showNewSiteToggle) return null;

  return (
    <div className={classes.root}>
      {showAdminToggle && <div className={classes.row}>
        <span className={classes.label}>Admin</span>
        <ToggleSwitch
          value={currentUser.isAdmin}
          setValue={handleAdminToggle}
          smallVersion
        />
      </div>}
      {showNewSiteToggle && <div className={classes.row}>
        <span className={classes.label}>Prefer new site</span>
        <ToggleSwitch
          value={preferNewSite}
          setValue={setPreferNewSite}
          smallVersion
        />
      </div>}
    </div>
  );
}

export default registerComponent('SiteToggle', SiteToggle, {styles});
