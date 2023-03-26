import React from 'react';
import { Components, registerComponent, getFragment } from "../../lib/vulcan-lib";
import Conversations from '../../lib/collections/conversations/collection';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

/**
 * Form for editing the title of a private messages conversation and also for
 * adding additional participants.
 */
const ConversationTitleEditForm = ({onClose, documentId}: {
  onClose?: ()=>void,
  documentId: string,
}) =>{
  return <Components.LWDialog open onClose={onClose}>
      <DialogTitle>{preferredHeadingCase("Conversation Options")}</DialogTitle>
      <DialogContent>
        <Components.WrappedSmartForm
          collection={Conversations}
          documentId={documentId}
          fragment={getFragment('conversationsListFragment')}
          queryFragment={getFragment('conversationsListFragment')}
          mutationFragment={getFragment('conversationsListFragment')}
          successCallback={() => {
            if (onClose)
              onClose();
          }}
        />
      </DialogContent>
    </Components.LWDialog>
}

const ConversationTitleEditFormComponent = registerComponent('ConversationTitleEditForm', ConversationTitleEditForm);

declare global {
  interface ComponentTypes {
    ConversationTitleEditForm: typeof ConversationTitleEditFormComponent
  }
}

