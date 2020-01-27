import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import { withStyles, createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme => ({
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
}));

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
const LoginPopup = ({onClose, classes}) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      className={classes.dialog}
      classes={{
        paper: classes.paper
      }}
    >
      <Components.WrappedLoginForm
        onSignedInHook={() => onClose()}
        onPostSignUpHook={() => onClose()}
      />
    </Dialog>
  );
}

const LoginPopupComponent = registerComponent('LoginPopup', LoginPopup,
  withStyles(styles, {name: "LoginPopup"}));

declare global {
  interface ComponentTypes {
    LoginPopup: typeof LoginPopupComponent
  }
}
