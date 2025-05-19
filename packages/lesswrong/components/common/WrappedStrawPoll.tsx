import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from './withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from './withDialog';
import LoginPopup from '../users/LoginPopup';

const styles = defineStyles("WrappedStrawPoll", (theme: ThemeType) => ({
  loginRequired: {
    border: theme.palette.border.faint,
    borderRadius: "4px",
    padding: "16px",
    position: "relative"
  },
  yellowBar: {
    backgroundColor: theme.palette.panelBackground.strawpoll,
    height: "4px",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0
  },
  heading: {
    marginTop: "0px !important"
  },
  text: {
    marginBottom: 0
  }
}));

export const WrappedStrawPoll = ({ id, src }: {
  id: string|null
  src: string
}) => {
  const currentUser = useCurrentUser();
  const { location } = useLocation();
  const { pathname } = location;
  const classes = useStyles(styles);
  
  if (currentUser) {
    return <div className="strawpoll-embed">
      <iframe id={id??undefined} src={src} />
    </div>
  } else {
    return <div className={classes.loginRequired}>
      <div className={classes.yellowBar} />
      <h3 className={classes.heading}>This poll is hidden</h3>
      <p className={classes.text}>
        Please <a href={`/auth/auth0?returnTo=${pathname}`}>log in</a> to vote in this poll.
      </p>
    </div>
  }
}

export const WrappedStrawPoll2 = ({children}: {
  children: React.ReactNode
}) => {
  const currentUser = useCurrentUser();
  const { location } = useLocation();
  const { pathname } = location;
  const classes = useStyles(styles);
  const { openDialog } = useDialog();

  const openLoginDialog = () => {
    openDialog({ name: "LoginPopup", contents: ({onClose}) => <LoginPopup onClose={onClose} /> });
  }
  
  if (currentUser) {
    return <>{children}</>
  } else {
    return <div className={classes.loginRequired}>
      <div className={classes.yellowBar} />
      <h3 className={classes.heading}>This poll is hidden</h3>
      <p className={classes.text}>
        Please <a href="#" onClick={openLoginDialog}>log in</a> to vote in this poll.
      </p>
    </div>
  }
}
