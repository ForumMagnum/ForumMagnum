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
    const { onClose, classes } = this.props;
    
    return (
      <Dialog
        title="Log In"
        modal={false}
        open={true}
        onClose={this.props.onClose}
      >
        <Components.WrappedLoginForm/>
      </Dialog>
    );
  }
}

registerComponent('LoginPopup', LoginPopup);