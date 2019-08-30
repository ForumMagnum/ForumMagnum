import React, { PureComponent } from 'react';
import { registerComponent, withUpdate } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = theme => ({
  root: {
    ...theme.typography.body1,
    marginLeft: theme.spacing.unit
  },
  verifyEmailButton: {
    marginTop: theme.spacing.unit
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
    this.props.updateUser({
      selector: {_id: this.props.currentUser._id},
      data: { whenConfirmationEmailSent: new Date() }
    });
    this.setState({
      emailSent: true
    });
  }

  render() {
    let { resend=false, currentUser, classes } = this.props;
    
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
          <div>You need to verify your email address to enable email notifications.</div>
          <Button color="secondary" variant="outlined"
            className={classes.verifyEmailButton}
            onClick={() => this.sendConfirmationEmail()}
          >
            {resend ? "Resend Confirmation Email"
                    : "Send Confirmation Email"}
          </Button>
        </div>
      );
    }
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('UsersEmailVerification', UsersEmailVerification,
  withErrorBoundary,
  withUser,
  [withUpdate, withUpdateOptions],
  withStyles(styles, { name: "UsersEmailVerification" })
);
