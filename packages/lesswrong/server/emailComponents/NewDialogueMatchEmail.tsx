import React from 'react';
import { getConfirmedCoauthorIds, postGetEditUrl, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { userGetDisplayName } from '../../lib/collections/users/helpers';

const NewDialogueMatchEmail = ({documentId, userId, targerUserId}: {
  documentId: string,
  userId?: string,
  targerUserId?: string,
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
