import React from 'react';
import { getConfirmedCoauthorIds, postGetEditUrl, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { userGetDisplayName } from '../../lib/collections/users/helpers';

export interface DialogueMatchEmailInfo {
    messageContents: string,
    messageAuthorId: string,
  }
  
  const NewDialogueMatchEmail = ({documentId}: {
    documentId: string,
  }) => {
  
    const { EmailContentItemBody } = Components;
        
    const { document: dialogueCheckInfo } = useSingle({
      // is this documentId for the DbDialogueCheck going to be the same one as the documentId for the DialogueCheckInfo?
      documentId: documentId,
      collectionName: "DialogueChecks",
      fragmentName: "DialogueCheckInfo",
    })
  
    if (!dialogueCheckInfo) return null;
    if (!dialogueCheckInfo.match) return null;
    
    // TODO: add a line to start a dialogue
    // TODO: add a line to message the user
    // TODO: add a line to go to /dialogueMatching
    return (<React.Fragment>
        <p>There is a new dialogue match for you!</p>
        </React.Fragment>);
  }
  
  const NewDialogueMatchEmailComponent = registerComponent("NewDialogueMatchEmail", NewDialogueMatchEmail);
  
  declare global {
    interface ComponentTypes {
      NewDialogueMatchEmail: typeof NewDialogueMatchEmailComponent
    }
  }
