import React, { PureComponent } from 'react';
import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import Button from '@material-ui/core/Button';
import defineComponent from '../../lib/defineComponent';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = theme => ({
  root: {
    ...theme.typography.body2,
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
          <div>You need to verify your email address to enable email notifications.</div>
          <Button color="secondary" variant="outlined"
            className={classes.verifyEmailButton}
            onClick={() => this.sendConfirmationEmail()}
          >
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

export default defineComponent({
  name: 'UsersEmailVerification',
  component: UsersEmailVerification,
  styles: styles,
  hocs: [ withErrorBoundary, withUser, [withEdit, withEditOptions] ]
});
