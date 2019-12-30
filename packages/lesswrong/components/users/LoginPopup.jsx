import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Dialog from '@material-ui/core/Dialog';
import { withStyles } from '@material-ui/core/styles';
import { withTracking } from "../../lib/analyticsEvents"

const styles = theme => ({
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
        className={classes.dialog}
        classes={{
          paper: classes.paper
        }}
      >
        <Components.WrappedLoginForm
          onSignedInHook={() => {
            console.log("onSignedInHook from in LoginPopup.jsx")
            this.props.captureEvent("onSignedInHook fired in LoginPopup.jsx")
            onClose()
          }}
          onPostSignUpHook={() => {
             console.log("onPostSignUpHook from in LoginPopup.jsx")
              this.props.captureEvent("onPostSignUpHook fired in LoginPopup.jsx")
             onClose()
          }
          }
        />
      </Dialog>
    );
  }
}

registerComponent('LoginPopup', LoginPopup, withTracking,
  withStyles(styles, {name: "LoginPopup"}));
