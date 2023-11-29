import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType): JssStyles => ({
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
  onClose?: ()=>void,
  classes: ClassesType,
}) => {
  const { LWDialog } = Components;
  return (
    <LWDialog
      open={true}
      onClose={onClose}
      className={classes.dialog}
      dialogClasses={{
        paper: classes.paper
      }}
    >
      <Components.LoginForm />
    </LWDialog>
  );
}

const LoginPopupComponent = registerComponent('LoginPopup', LoginPopup, {styles});

declare global {
  interface ComponentTypes {
    LoginPopup: typeof LoginPopupComponent
  }
}
