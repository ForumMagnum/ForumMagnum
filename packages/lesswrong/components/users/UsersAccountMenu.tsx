import React, { MouseEvent, useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useTracking } from '../../lib/analyticsEvents';
import { isFriendlyUI } from '../../themes/forumTheme';
import { blackBarTitle } from '../../lib/publicSettings';
import { useLoginPopoverContext } from '../hooks/useLoginPopoverContext';
import { Paper } from '../widgets/Paper';

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: isFriendlyUI ? undefined : 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: isFriendlyUI ? undefined : 400,
    opacity: .8,
    color: blackBarTitle.get() ? theme.palette.text.alwaysWhite : theme.palette.header.text,
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
  const {onLogin, onSignup} = useLoginPopoverContext();
  const {EAButton, EALoginPopover} = Components;
  return (
    <div className={classes.root}>
      <EAButton
        style="grey"
        onClick={onLogin}
        data-testid="user-login-button"
        className={classes.login}
      >
        Login
      </EAButton>
      <EAButton
        onClick={onSignup}
        data-testid="user-signup-button"
        className={classes.signUp}
      >
        Sign up
      </EAButton>
      <EALoginPopover />
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

  const {LWClickAwayListener, LWPopper, LoginForm} = Components;
  return (
    <div className={classes.root}>
      <Button onClick={handleClick}>
        <span className={classes.userButton}>
          Login
        </span>
      </Button>
      <LWPopper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
      >
        <LWClickAwayListener onClickAway={handleRequestClose}>
          <Paper>
            {open && <LoginForm />}
          </Paper>
        </LWClickAwayListener>
      </LWPopper>
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
