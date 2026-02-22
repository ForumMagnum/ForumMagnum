import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { MouseEvent, useCallback, useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import LWClickAwayListener from "../common/LWClickAwayListener";
import LWPopper from "../common/LWPopper";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';
import { Paper } from '../widgets/Paper';
import LoginForm from "./LoginForm";

const styles = defineStyles('UsersAccountMenu', (theme: ThemeType) => ({
  root: {
    marginTop: 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: 400,
    opacity: .8,
    color: isBlackBarTitle ? theme.palette.text.alwaysWhite : theme.palette.header.text,
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
