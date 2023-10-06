import React from 'react';
import { getConfirmedCoauthorIds, postGetEditUrl, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';


const NewDialogueMessagesEmail = ({documentId, userId}: {
  documentId: string,
  userId: string,
  classes: any,
}) => {
  const { document: post } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    extraVariables: {
      version: 'String'
    }
  });
  if (!post) return null;
  if (!post.collabEditorDialogue) return null;
  
  const dialogueParticipantIds = [post.userId, ...getConfirmedCoauthorIds(post)];
  
  if (dialogueParticipantIds.includes(userId)) {
    const editUrl = postGetEditUrl(post._id)
    
    return (<React.Fragment>
      <p>There are new responses in your dialogue, <a href={editUrl}>{post.title}</a>.</p>
      <p><a href={editUrl}>Click here</a>to respond!</p>
    </React.Fragment>);
  }
  else {
    return (<React.Fragment>
      <p>There are new responses in the dialogue you are subscribed, <a href={postGetPageUrl(post)}>{post.title}</a>.
      </p>
    </React.Fragment>);
  }
}

const NewDialogueMessagesEmailComponent = registerComponent("NewDialogueMessagesEmail", NewDialogueMessagesEmail);

declare global {
  interface ComponentTypes {
    NewDialogueMessagesEmail: typeof NewDialogueMessagesEmailComponent
  }
}
