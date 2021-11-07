import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userHasRedesignedSettingsPage } from '../../lib/betas';

const UsersEditForm = ({currentUser, terms}: {
  currentUser: UsersCurrent,
  terms: {slug?: string, documentId?: string},
}) => {
  // Handle beta-gating of the redefined user settings page, ie
  // selecting between NewUsersEditForm and OldUsersEditForm. When
  // this is fully shipped, NewUsersEditForm will be renamed to
  // UsersEditForm and this will go away.
  
  if (userHasRedesignedSettingsPage(currentUser)) {
    return <Components.NewUsersEditForm currentUser={currentUser} terms={terms}/>
  } else {
    return <Components.OldUsersEditForm terms={terms}/>
  }
}

const UsersEditFormComponent = registerComponent('UsersEditForm', UsersEditForm);

declare global {
  interface ComponentTypes {
    UsersEditForm: typeof UsersEditFormComponent
  }
}
