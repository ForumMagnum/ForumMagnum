import React, { useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Conversations, { userCanStartConversations } from '../../lib/collections/conversations/collection';
import { forumTypeSetting } from '../../lib/instanceSettings';
import qs from 'qs';
import { useMulti } from '../../lib/crud/withMulti';
import { useDialog } from '../common/withDialog';

// Button used to start a new conversation for a given user
const NewConversationButton = ({ user, currentUser, children, templateCommentId, from }: {
  user: {
    _id: string
  },
  currentUser: UsersCurrent|null,
  templateCommentId?: string,
  from?: string,
  children: any
}) => {
  
  const { history } = useNavigation();
  const { openDialog } = useDialog()
  const { create: createConversation } = useCreate({
    collection: Conversations,
    fragmentName: 'newConversationFragment',
  });
  
  
  // Checks if unnamed conversation between the two users exists
  const terms: ConversationsViewTerms = {
    view: 'userGroupUntitledConversations',
    userId: currentUser?._id,
    participantIds: [currentUser?._id || '', user._id]
  };
  const { results } = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: 'conversationIdFragment',
    fetchPolicy: 'cache-and-network',
    limit: 1,
    skip: !currentUser
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
    let searchParams: Array<string> = []
    if (templateCommentId) {
      searchParams.push(qs.stringify({templateCommentId: templateCommentId}))
    }
    if (from) {
      searchParams.push(`from=${from}`)
    }
    const search = searchParams ? {search:`?${searchParams.join('&')}`} : {}
    
    for (let conversation of (results ?? [])) {
      history.push({pathname: `/inbox/${conversation._id}`, ...search})
      return
    }
    void newConversation(search);
  }

  if (currentUser && !userCanStartConversations(currentUser)) return null
  
  if (currentUser?._id === user._id)
    return <div>
      {children}
    </div>
  
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
