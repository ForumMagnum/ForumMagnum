import React, { useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { useAdminToggle } from './useAdminToggle';
import ToggleSwitch from '../common/ToggleSwitch';
import Cookies from 'universal-cookie';

const PREFER_NEW_SITE_COOKIE = 'prefer_ea_forum_v3';

const styles = (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    left: 20,
    bottom: 20,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 8,
    boxShadow: theme.palette.boxShadow.eaCard,
    padding: '12px 16px',
    zIndex: theme.zIndexes.intercomButton,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    [theme.breakpoints.down('md')]: {
      left: 10,
      bottom: 58,
      padding: '8px 12px',
      fontSize: 11,
    },
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
    gap: '12px',
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

  const [preferNewSite, setPreferNewSite] = useState(() => {
    const cookies = new Cookies();
    return cookies.get(PREFER_NEW_SITE_COOKIE) === 'true';
  });

  const handlePreferNewSiteChange = useCallback((value: boolean) => {
    const cookies = new Cookies();
    if (value) {
      cookies.set(PREFER_NEW_SITE_COOKIE, 'true', { path: '/' });
    } else {
      cookies.remove(PREFER_NEW_SITE_COOKIE, { path: '/' });
    }
    setPreferNewSite(value);
  }, []);

  const handleAdminToggle = useCallback((value: boolean) => {
    if (loading) return;
    if (value) {
      toggleOn?.();
    } else {
      toggleOff?.();
    }
  }, [loading, toggleOn, toggleOff]);

  const isRealAdmin = userIsMemberOf(currentUser, "realAdmins");
  
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
          setValue={handlePreferNewSiteChange}
          smallVersion
        />
      </div>
    </div>
  );
}

export default registerComponent('AdminToggle', AdminToggle, {styles});



