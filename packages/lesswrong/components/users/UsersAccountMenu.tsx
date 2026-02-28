import React, { MouseEvent, useCallback, useState } from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useTracking } from '../../lib/analyticsEvents';
import LWClickAwayListener from "../common/LWClickAwayListener";
import LWPopper from "../common/LWPopper";
import LoginForm from "./LoginForm";
import { Paper } from '../widgets/Paper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';

const styles = defineStyles('UsersAccountMenu', (theme: ThemeType) => ({
  root: {
    marginTop: theme.isFriendlyUI ? undefined : 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: theme.isFriendlyUI ? undefined : 400,
    opacity: .8,
    color: isBlackBarTitle ? theme.palette.text.alwaysWhite : theme.palette.header.text,
  },
}));

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
