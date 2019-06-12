import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { withApollo } from 'react-apollo';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

const styles = theme => ({
  root: {
    textAlign: "center",
  }
});

class AccountsVerifyEmail extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      pending: true,
      error: null
    }
  }

  componentDidMount() {
    const token = this.props.params.token;
    Accounts.verifyEmail(token, (verifyEmailResult) => {
      if(verifyEmailResult && verifyEmailResult.error) {
        this.setState({
          pending: false,
          error: verifyEmailResult.reason
        });
      } else {
        this.setState({
          pending: false,
          error: null
        });

        // Reset the Apollo cache. Unfortunately there isn't
        // really a more granular way to do this (see
        // https://github.com/apollographql/apollo-feature-requests/issues/4 ).
        // For LW2, this ensures that, if you navigate from
        // the "Your email address has been verified" page
        // to the "Edit Account" page, you won't see a
        // widget telling you your address is still
        // unverified.
        this.props.client.resetStore();
      }
    });
  }

  render() {
    const { currentUser, classes } = this.props;
    
    if(this.state.pending) {
      return (
        <div className={classes.root}>
          <Components.Loading />
        </div>
      );
    } else if(this.state.error) {
      if (Users.emailAddressIsVerified(currentUser)) {
        return (
          <div className={classes.root}>
            Your email address is already verified.
          </div>
        );
      } else {
        return (
          <div className={classes.root}>
            {this.state.error}
          </div>
        );
      }
    } else {
      return (
        <div className={classes.root}>
          Your email address has been verified.
        </div>
      );
    }
  }
}

AccountsVerifyEmail.propTypes = {
  currentUser: PropTypes.object,
  params: PropTypes.object,
};

AccountsVerifyEmail.displayName = 'AccountsEnrollAccount';

// Shadows AccountsVerifyEmail in meteor/vulcan:accounts
registerComponent('AccountsVerifyEmail', AccountsVerifyEmail,
  withApollo, withUser,
  withStyles(styles, { name: "AccountsVerifyEmail" }));

