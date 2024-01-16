import React, { MouseEvent, useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { useTracking } from '../../lib/analyticsEvents';
import { isEAForum } from '../../lib/instanceSettings';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: isFriendlyUI ? undefined : 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: isFriendlyUI ? undefined : 400,
    opacity: .8,
    color: theme.palette.header.text,
  },
  login: {
    marginLeft: 12,
    marginRight: 8
  },
  signUp: {
    display: 'inline-block',
    marginRight: 8,
    '@media (max-width: 540px)': {
      display: 'none'
    }
  },
})

const UsersAccountMenu = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {pathname} = useLocation();
  const {captureEvent} = useTracking();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = useCallback((ev: MouseEvent) => {
    ev.preventDefault();
    captureEvent("loginButtonClicked", {open: true});
    setOpen(true);
    setAnchorEl(ev.currentTarget as HTMLElement);
  }, [captureEvent]);

  const handleRequestClose = useCallback(() => {
    captureEvent("loginButtonClicked", {open: false});
    setOpen(false);
  }, [captureEvent]);

  const {EAButton, LoginForm} = Components;
  return (
    <div className={classes.root}>
      {isEAForum ? <>
        <EAButton
          style="grey"
          href={`/auth/auth0?returnTo=${pathname}`}
          className={classes.login}
        >
          Login
        </EAButton>
        <EAButton
          href={`/auth/auth0?screen_hint=signup&returnTo=${pathname}`}
          className={classes.signUp}
        >
          Sign up
        </EAButton>
      </> : <>
        <Button onClick={handleClick}>
          <span className={classes.userButton}>
            Login
          </span>
        </Button>
        <Popover
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{horizontal: "left", vertical: "bottom"}}
          onClose={handleRequestClose}
        >
          {open && <LoginForm />}
        </Popover>
      </>}
    </div>
  );
}

const UsersAccountMenuComponent = registerComponent(
  "UsersAccountMenu",
  UsersAccountMenu,
  {styles},
);

declare global {
  interface ComponentTypes {
    UsersAccountMenu: typeof UsersAccountMenuComponent
  }
}
