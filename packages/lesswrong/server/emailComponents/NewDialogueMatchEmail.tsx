import React from 'react';
import { getConfirmedCoauthorIds, postGetEditUrl, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { userGetDisplayName } from '../../lib/collections/users/helpers';

const NewDialogueMatchEmail = ({documentId, userId, targetUserDisplayName}: {
  documentId: string,
  userId?: string,
  targetUserDisplayName?: string,
}) => {
      
  const { document: dialogueCheckInfo } = useSingle({
    documentId: documentId,
    collectionName: "DialogueChecks",
    fragmentName: "DialogueCheckInfo",
  })

  if (!dialogueCheckInfo) return null;
  if (!dialogueCheckInfo.match) return null;
  
  return (<React.Fragment>
      <p>There is a new dialogue match for you! Both you and {targetUserDisplayName} have indicated that you would be interested in having a dialogue. </p>
      </React.Fragment>);
}

const NewDialogueMatchEmailComponent = registerComponent("NewDialogueMatchEmail", NewDialogueMatchEmail);

declare global {
  interface ComponentTypes {
    NewDialogueMatchEmail: typeof NewDialogueMatchEmailComponent
  }
}
