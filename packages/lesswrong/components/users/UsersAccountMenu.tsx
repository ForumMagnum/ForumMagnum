import React, { MouseEvent, useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useTracking } from '../../lib/analyticsEvents';
import { isFriendlyUI } from '../../themes/forumTheme';
import { blackBarTitle } from '@/lib/instanceSettings';
import { useLoginPopoverContext } from '../hooks/useLoginPopoverContext';
import EAButton from "../ea-forum/EAButton";
import EALoginPopover from "../ea-forum/auth/EALoginPopover";
import LWClickAwayListener from "../common/LWClickAwayListener";
import LWPopper from "../common/LWPopper";
import LoginForm from "./LoginForm";
import { Paper } from '../widgets/Paper';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('UsersAccountMenu', (theme: ThemeType) => ({
  root: {
    marginTop: theme.isFriendlyUI ? undefined : 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: theme.isFriendlyUI ? undefined : 400,
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
}));

export const EAUsersAccountMenu = () => {
  const classes = useStyles(styles);
  const {onLogin, onSignup} = useLoginPopoverContext();
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

export const LWUsersAccountMenu = () => {
  const classes = useStyles(styles);
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
  return (
    <div className={classes.root}>
      <Button data-testid="user-signup-button" onClick={handleClick}>
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
