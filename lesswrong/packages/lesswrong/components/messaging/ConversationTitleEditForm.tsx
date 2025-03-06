import React from 'react';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";
import LWDialog from "@/components/common/LWDialog";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";
import { DialogContent, DialogTitle } from "@/components/mui-replacement";

/**
 * Form for editing the title of a private messages conversation and also for
 * adding additional participants.
 */
const ConversationTitleEditForm = ({onClose, documentId}: {
  onClose?: () => void,
  documentId: string,
}) =>{
  return <LWDialog open onClose={onClose}>
      <DialogTitle>{preferredHeadingCase("Conversation Options")}</DialogTitle>
      <DialogContent>
        <WrappedSmartForm
          collectionName="Conversations"
          documentId={documentId}
          fragment={getFragment('ConversationsList')}
          queryFragment={getFragment('ConversationsList')}
          mutationFragment={getFragment('ConversationsList')}
          successCallback={() => {
            if (onClose)
              onClose();
          }}
        />
      </DialogContent>
    </LWDialog>
}

const ConversationTitleEditFormComponent = registerComponent('ConversationTitleEditForm', ConversationTitleEditForm);

declare global {
  interface ComponentTypes {
    ConversationTitleEditForm: typeof ConversationTitleEditFormComponent
  }
}

export default ConversationTitleEditFormComponent;
