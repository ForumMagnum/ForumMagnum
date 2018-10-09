import React from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { withDocument, Components, registerComponent, withMessages } from 'meteor/vulcan:core';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { gql } from 'react-apollo';

const UsersProfileCheck = ({currentUser, document, loading, flash}, context) => {

  // we're loading all fields marked as "mustComplete" using withDocument
  const userMustCompleteFields = document;

  // if user is not logged in, or userMustCompleteFields is still loading, don't return anything
  if (!currentUser || loading) {

    return null;

  } else {

    // return fields that are required by the schema but haven't been filled out yet
    const fieldsToComplete = _.filter(Users.getRequiredFields(), fieldName => {
      return !userMustCompleteFields[fieldName];
    });

    if (fieldsToComplete.length > 0) {
      const footer = (
        <a className="complete-profile-logout" onClick={ () => Meteor.logout(() => window.location.reload() /* something is broken here when giving the apollo client as a prop*/) }>
          <FormattedMessage id="app.or"/> <FormattedMessage id="users.log_out"/>
        </a>
      );
      return (
        <Components.Modal
          size='small'
          show={ true }
          showCloseButton={ false }
          title={<FormattedMessage id="users.complete_profile"/>}
          footerContent={ footer }
        >
          <Components.SmartForm
            collection={ Users }
            documentId={ currentUser._id }
            fields={ fieldsToComplete }
            showRemove={ false }
            successCallback={user => {
              const newUser = {...currentUser, ...user};
              if (Users.hasCompletedProfile(newUser)) {
                flash({id: "users.profile_completed", type: 'success'});
              }
            }}
          />
        </Components.Modal>
      );
    } else {

      return null;

    }
  }

};


UsersProfileCheck.propTypes = {
  currentUser: PropTypes.object
};

UsersProfileCheck.displayName = 'UsersProfileCheck';

const mustCompleteFragment = gql`
  fragment UsersMustCompleteFragment on User {
    _id
    ${Users.getRequiredFields().join('\n')}
  }
`

const options = {
  collection: Users,
  queryName: 'usersMustCompleteQuery',
  fragment: mustCompleteFragment,
};

registerComponent('UsersProfileCheck', UsersProfileCheck, withMessages, [withDocument, options]);
