import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  loginRequired: {
    border: theme.palette.border.faint,
    borderRadius: "4px",
    padding: "16px",
    position: "relative"
  },
  yellowBar: {
    // Color used by StrawPoll
    backgroundColor: "rgba(251, 191, 36, 1)",
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
});

const StrawPollLoggedOut = ({ pathname, classes }: {
  pathname: string
  classes: ClassesType
}) => (
  <div className={classes.loginRequired}>
    <div className={classes.yellowBar} />
    <h3 className={classes.heading}>This poll is hidden</h3>
    <p className={classes.text}>
      Please <a href={`/auth/auth0?returnTo=${pathname}`}>log in</a> to vote in this poll.
    </p>
  </div>
);

const StrawPollLoggedOutComponent = registerComponent("StrawPollLoggedOut", StrawPollLoggedOut, {styles})

declare global {
  interface ComponentTypes {
    StrawPollLoggedOut: typeof StrawPollLoggedOutComponent
  }
}
