import React from 'react';
import { getConfirmedCoauthorIds, postGetEditUrl, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { userGetDisplayName } from '../../lib/collections/users/helpers';

export interface DialogueMessageEmailInfo {
  messageContents: string,
  messageAuthorId: string,
}

const NewDialogueMessagesEmail = ({documentId, userId, dialogueMessageEmailInfo}: {
  documentId: string,
  userId: string,
  dialogueMessageEmailInfo?: DialogueMessageEmailInfo
}) => {

  const { EmailContentItemBody } = Components;

  const { document: post } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    extraVariables: {
      version: 'String'
    }
  });
      
  const { document: author } = useSingle({
    documentId: dialogueMessageEmailInfo?.messageAuthorId,
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    skip: !dialogueMessageEmailInfo
  })

  if (!post) return null;
  if (!post.collabEditorDialogue) return null;
  
  const dialogueParticipantIds = [post.userId, ...getConfirmedCoauthorIds(post)];
  
  if (dialogueParticipantIds.includes(userId)) {
    const editUrl = postGetEditUrl(post._id)

    if (dialogueMessageEmailInfo && author) {
      const authorDisplayName = userGetDisplayName(author)

      return (<React.Fragment>
        <p>{authorDisplayName} left a new reply in your dialogue "<a href={editUrl}>{post.title}</a>".</p>
        <EmailContentItemBody dangerouslySetInnerHTML={{ __html: dialogueMessageEmailInfo.messageContents }}/> 
        <p><a href={editUrl}>Click here</a>to respond!</p>
      </React.Fragment>);
    }
    
    return (<React.Fragment>
      <p>There are new responses in your dialogue "<a href={editUrl}>{post.title}</a>".</p>
      <p><a href={editUrl}>Click here</a>to respond!</p>
    </React.Fragment>);
  }
  else {
    return <>
      <p>There are new responses in the dialogue you are subscribed to, <a href={postGetPageUrl(post)}>{post.title}</a>.
      </p>
    </>;
  }
}

const NewDialogueMessagesEmailComponent = registerComponent("NewDialogueMessagesEmail", NewDialogueMessagesEmail);

declare global {
  interface ComponentTypes {
    NewDialogueMessagesEmail: typeof NewDialogueMessagesEmailComponent
  }
}
