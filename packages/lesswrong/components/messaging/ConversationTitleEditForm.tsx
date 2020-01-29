/*

A component to configure the "Edit Title" form.

*/

import React from 'react';
import { Components, registerComponent, getFragment } from "meteor/vulcan:core";
import Conversations from '../../lib/collections/conversations/collection';
import { useCurrentUser } from '../common/withUser';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

const ConversationTitleEditForm = ({onClose, documentId}) =>{
  const currentUser = useCurrentUser()
  return <Dialog open onClose={onClose}>
      <DialogTitle>Conversation Options</DialogTitle>
      <DialogContent>
        <Components.WrappedSmartForm
          collection={Conversations}
          documentId={documentId}
          fragment={getFragment('conversationsListFragment')}
          queryFragment={getFragment('conversationsListFragment')}
          mutationFragment={getFragment('conversationsListFragment')}
          successCallback={document => {
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
}

const ConversationTitleEditFormComponent = registerComponent('ConversationTitleEditForm', ConversationTitleEditForm);

declare global {
  interface ComponentTypes {
    ConversationTitleEditForm: typeof ConversationTitleEditFormComponent
  }
}

