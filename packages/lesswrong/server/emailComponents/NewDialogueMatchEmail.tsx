import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { getSiteUrl } from '../vulcan-lib';

const NewDialogueMatchEmail = ({documentId, targetUser}: {
  documentId: string,
  targetUser?: DbUser | null,
}) => {
  const { EmailUsername } = Components;
      
  const { document: dialogueCheckInfo } = useSingle({
    documentId: documentId,
    collectionName: "DialogueChecks",
    fragmentName: "DialogueCheckInfo",
  })

  if (!dialogueCheckInfo) return null;
  if (!dialogueCheckInfo.match) return null;

  return (<React.Fragment>
      <p>There is a new dialogue match for you! Both you and <EmailUsername user={targetUser}/> have indicated that you would be potentially interested in having a dialogue. </p>
      <p>To see all matches, visit the <a href={`${getSiteUrl()}dialogueMatching`}>Dialogue Matching page</a>.</p>
      </React.Fragment>);
}

const NewDialogueMatchEmailComponent = registerComponent("NewDialogueMatchEmail", NewDialogueMatchEmail);

declare global {
  interface ComponentTypes {
    NewDialogueMatchEmail: typeof NewDialogueMatchEmailComponent
  }
}
