import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import {isFriendlyUI} from '../../themes/forumTheme'
import LWDialog from "@/components/common/LWDialog";
import LoginForm from "@/components/users/LoginForm";

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
const LoginPopup = ({onClose, classes}: {
  onClose?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  if (isFriendlyUI) {
    return (
      <LoginForm onClose={onClose} />
    );
  }

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      className={classes.dialog}
      dialogClasses={{
        paper: classes.paper
      }}
    >
      <LoginForm />
    </LWDialog>
  );
}

const LoginPopupComponent = registerComponent('LoginPopup', LoginPopup, {styles});

declare global {
  interface ComponentTypes {
    LoginPopup: typeof LoginPopupComponent
  }
}

export default LoginPopupComponent;
