import React, { PureComponent } from 'react';
import { Components, registerComponent, withCurrentUser, withEdit } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const styles = theme => ({
  root: {
  }
});

class UsersEmailVerification extends PureComponent
{
  constructor(props) {
    super(props);
    this.state = {
      emailSent: false,
    };
  }
  
  sendConfirmationEmail() {
    this.props.editMutation({
      documentId: this.props.currentUser._id,
      set: { whenConfirmationEmailSent: new Date() },
      unset: {}
    });
    this.setState({
      emailSent: true
    });
  }
  
  render() {
    let { currentUser, classes } = this.props;
    
    if(Users.emailAddressIsVerified(currentUser)) {
      return (
        <div className={classes.root}>
          Your email address is verified.
        </div>
      );
    } else if(this.state.emailSent) {
      return (
        <div className={classes.root}>
          Check your email for a confirmation link.
        </div>
      );
    } else {
      return (
        <div className={classes.root}>
          <span>Your email address has not been verified.</span>
          <Button onClick={() => this.sendConfirmationEmail()}>
            Send Confirmation Email
          </Button>
        </div>
      );
    }
  }
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('UsersEmailVerification', UsersEmailVerification,
  withCurrentUser,
  [withEdit, withEditOptions],
  withStyles(styles, { name: "UsersEmailVerification" })
);