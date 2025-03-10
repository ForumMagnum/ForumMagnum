import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

/**
 * Form for editing the title of a private messages conversation and also for
 * adding additional participants.
 */
const ConversationTitleEditForm = ({onClose, documentId}: {
  onClose?: () => void,
  documentId: string,
}) =>{
  return <Components.LWDialog open onClose={onClose}>
      <DialogTitle>{preferredHeadingCase("Conversation Options")}</DialogTitle>
      <DialogContent>
        <Components.WrappedSmartForm
          collectionName="Conversations"
          documentId={documentId}
          queryFragmentName={'ConversationsList'}
          mutationFragmentName={'ConversationsList'}
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
