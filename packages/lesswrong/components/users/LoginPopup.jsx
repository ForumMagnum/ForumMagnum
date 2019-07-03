import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Dialog from '@material-ui/core/Dialog';

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
    const { onClose } = this.props;
    
    return (
      <Dialog
        open={true}
        onClose={onClose}
      >
        <Components.WrappedLoginForm
          onSignedInHook={() => onClose()}
          onPostSignUpHook={() => onClose()}
        />
      </Dialog>
    );
  }
}

registerComponent('LoginPopup', LoginPopup);