import { Components, registerComponent, withMessages, getFragment } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from 'meteor/vulcan:i18n';
import Users from 'meteor/vulcan:users';
import Button from '@material-ui/core/Button';
import { Accounts } from 'meteor/accounts-base';
import { withRouter } from 'react-router'
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import { withApollo } from 'react-apollo'

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    width: "60%",
    margin: "auto",
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },
  
  header: {
    margin: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 4,
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing.unit/2,
    },
  },
  resetButton: {
    marginBottom:theme.spacing.unit * 4
  }
})

const UsersEditForm = (props) => {

  const { classes, terms, currentUser, client } = props

  if(!terms.slug && !terms.documentId) {
    // No user specified and not logged in
    return (
      <div className={classes.root}>
        Log in to edit your profile.
      </div>
    );
  }
  if (!Users.canEdit(currentUser,
    terms.documentId ? {_id: terms.documentId} : {slug: terms.slug})) {
    return <FormattedMessage id="app.noPermission"/>;
  }

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}><FormattedMessage id="users.edit_account"/></Typography>
      <Button color="secondary" variant="outlined" className={classes.resetButton } onClick={() => Accounts.forgotPassword({ email: props.currentUser.email },
          (error) => props.flash({ messageString: error ? error.reason : "Sent password reset email to " + props.currentUser.email }))
        }>
        Reset Password
      </Button>

      <Components.WrappedSmartForm
        collection={Users}
        {...terms}
        successCallback={user => {
          props.flash({ id: 'users.edit_success', properties: {name: Users.getDisplayName(user)}, type: 'success'})
          client.resetStore()
          props.router.push(Users.getProfileUrl(user));
        }}
        queryFragment={getFragment('UsersEdit')}
        mutationFragment={getFragment('UsersProfile')}
        showRemove={false}
      />
    </div>
  );
};


UsersEditForm.propTypes = {
  terms: PropTypes.object, // a user is defined by its unique _id or its unique slug
};

UsersEditForm.contextTypes = {
  intl: intlShape
};

UsersEditForm.displayName = 'UsersEditForm';

registerComponent('UsersEditForm', UsersEditForm,
  withMessages, withUser, withApollo, withRouter,
  withStyles(styles, { name: "UsersEditForm" })
);
