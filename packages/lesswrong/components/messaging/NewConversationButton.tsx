import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Conversations from '../../lib/collections/conversations/collection';
import { forumTypeSetting } from '../../lib/instanceSettings';
import qs from 'qs';
import { useMulti } from '../../lib/crud/withMulti';
import { useDialog } from '../common/withDialog';

// Button used to start a new conversation for a given user
const NewConversationButton = ({ user, currentUser, children, templateCommentId }: {
  user: UsersMinimumInfo,
  currentUser: UsersCurrent|null,
  templateCommentId?: string,
  children: any
}) => {
  
  const { history } = useNavigation();
  const { openDialog } = useDialog()
  const { create: createConversation } = useCreate({
    collection: Conversations,
    fragmentName: 'newConversationFragment',
  });
  
  
  // Checks if unnamed conversation between the two users exists
  const terms: ConversationsViewTerms = {view: 'userUntitledConversations', userId: currentUser?._id};
  const { results } = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: 'conversationsListFragment',
    fetchPolicy: 'cache-and-network',
    limit: 1,
  });
  
  const newConversation = useCallback(async (search) =>  {
    const alignmentFields = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}

    const response = await createConversation({
      data: {participantIds:[user._id, currentUser?._id], ...alignmentFields},
    })
    const conversationId = response.data.createConversation.data._id
    history.push({pathname: `/inbox/${conversationId}`, ...search})
  }, [createConversation, user, currentUser, history]);

  const existingConversationCheck = () => {
    let conversationExists = false;
    const search = templateCommentId ? {search:`?${qs.stringify({templateCommentId: templateCommentId})}`} : {}
    results?.forEach(conversation => {
      if (conversation.title === null && conversation.participants.some(participant => participant._id === user._id)){
        history.push({pathname: `/inbox/${conversation._id}`, ...search})
        conversationExists = true;
      }
    })
    conversationExists ? undefined : void newConversation(search);
  }
  
  return (
    <div onClick={currentUser ? existingConversationCheck : () => openDialog({componentName: "LoginPopup"})}>
      {children}
    </div>
  )
}

const NewConversationButtonComponent = registerComponent('NewConversationButton', NewConversationButton);

declare global {
  interface ComponentTypes {
    NewConversationButton: typeof NewConversationButtonComponent
  }
}

