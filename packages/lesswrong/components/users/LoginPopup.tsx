import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import {isFriendlyUI} from '../../themes/forumTheme'
import LWDialog from "../common/LWDialog";
import LoginForm from "./LoginForm";

const styles = (theme: ThemeType) => ({
  dialog: {
    zIndex: theme.zIndexes.loginDialog
  },
  paper: {
    // Remove left/right margins so that the login form fits on small phone
    // screens. (It's fixed-width horizontally centered anyways so this is
    // fine.)
    marginLeft: 0,
    marginRight: 0,
  },
});

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
const LoginPopup = ({onClose, startingState, signupTitle, signupMessage, classes}: {
  onClose?: () => void,
  startingState?: "login" | "signup" | "pwReset",
  signupTitle?: string,
  signupMessage?: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  if (isFriendlyUI) {
    return (
      <LoginForm
        onClose={onClose}
        startingState={startingState}
        signupTitle={signupTitle}
        signupMessage={signupMessage}
      />
    );
  }

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      className={classes.dialog}
      paperClassName={classes.paper}
    >
      <LoginForm
        startingState={startingState}
        signupTitle={signupTitle}
        signupMessage={signupMessage}
      />
    </LWDialog>
  );
}

export default registerComponent('LoginPopup', LoginPopup, {styles});
