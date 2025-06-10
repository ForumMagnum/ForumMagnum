import React from 'react';
import { getConfirmedCoauthorIds, postGetEditUrl, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { EmailContentItemBody } from './EmailContentItemBody';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const UsersMinimumInfoQuery = gql(`
  query NewDialogueMessagesEmail1($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersMinimumInfo
      }
    }
  }
`);

const PostsRevisionQuery = gql(`
  query NewDialogueMessagesEmail($documentId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsRevision
      }
    }
  }
`);

export interface DialogueMessageEmailInfo {
  messageContents: string,
  messageAuthorId: string,
}

export const NewDialogueMessagesEmail = ({documentId, userId, dialogueMessageEmailInfo}: {
  documentId: string,
  userId: string,
  dialogueMessageEmailInfo?: DialogueMessageEmailInfo
}) => {
  const { data: dataPost } = useQuery(PostsRevisionQuery, {
    variables: { documentId: documentId },
  });
  const post = dataPost?.post?.result;
      
  const { data: dataUser } = useQuery(UsersMinimumInfoQuery, {
    variables: { documentId: dialogueMessageEmailInfo?.messageAuthorId },
    skip: !dialogueMessageEmailInfo,
  });
  const author = dataUser?.user?.result;

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
