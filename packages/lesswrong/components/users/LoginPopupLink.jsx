import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';

const styles = theme => ({
  popup: {
    backgroundColor: "white",
    position: "absolute",
    top: 50,
    
    // Horizontally center
    left: "50%",
    transform: "translateX(-50%)"
  }
});

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
class LoginPopupLink extends PureComponent {
  constructor() {
    super();
    this.state = {
      isOpen: false
    }
  }
  
  render() {
    const { children, classes } = this.props;
    
    return (
      <div>
        <a onClick={(e) => this.setState({isOpen: true})}>
          { children }
        </a>
        <Modal
          open={this.state.isOpen}
          onClose={(e) => this.setState({isOpen: false})}
        >
          <div className={classes.popup}>
            <Components.AccountsLoginForm/>
          </div>
        </Modal>
      </div>
    );
  }
}

registerComponent('LoginPopupLink', LoginPopupLink, withStyles(styles, { name: "LoginPopupLink" }));