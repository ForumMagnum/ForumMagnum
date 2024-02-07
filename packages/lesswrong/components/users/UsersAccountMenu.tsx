import React, { MouseEvent, useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { useTracking } from '../../lib/analyticsEvents';
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

const EAUsersAccountMenu = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [action, setAction] = useState<"login" | "signup" | null>(null);

  const onLogin = useCallback(() => setAction("login"), []);
  const onSignup = useCallback(() => setAction("signup"), []);

  const {EAButton, EALoginPopover} = Components;
  return (
    <div className={classes.root}>
      <EAButton
        style="grey"
        onClick={onLogin}
        className={classes.login}
      >
        Login
      </EAButton>
      <EAButton
        onClick={onSignup}
        className={classes.signUp}
      >
        Sign up
      </EAButton>
      <EALoginPopover
        open={!!action}
        setAction={setAction}
        isSignup={action === "signup"}
      />
    </div>
  );
}

const LWUsersAccountMenu = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
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

  const {LoginForm} = Components;
  return (
    <div className={classes.root}>
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
    </div>
  );
}

const UsersAccountMenuComponent = registerComponent(
  "UsersAccountMenu",
  isFriendlyUI ? EAUsersAccountMenu : LWUsersAccountMenu,
  {styles},
);

declare global {
  interface ComponentTypes {
    UsersAccountMenu: typeof UsersAccountMenuComponent
  }
}
