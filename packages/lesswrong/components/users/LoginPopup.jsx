import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Dialog from '@material-ui/core/Dialog';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  dialog: {
    // Remove left/right margins so that the login form fits on small phone
    // screens. (It's fixed-width horizontally centered anyways so this is
    // fine.)
    marginLeft: 0,
    marginRight: 0,
  },
});

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
class LoginPopup extends PureComponent {
  constructor() {
    super();
    this.state = {
      isOpen: false
    }
  }
  
  render() {
    const { classes, onClose } = this.props;
    
    return (
      <Dialog
        open={true}
        onClose={onClose}
        classes={{
          paper: classes.dialog
        }}
      >
        <Components.WrappedLoginForm
          onSignedInHook={() => onClose()}
          onPostSignUpHook={() => onClose()}
        />
      </Dialog>
    );
  }
}

registerComponent('LoginPopup', LoginPopup,
  withStyles(styles, {name: "LoginPopup"}));
