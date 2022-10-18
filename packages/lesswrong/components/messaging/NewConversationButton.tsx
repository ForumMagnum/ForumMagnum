import React, { useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Conversations, { userCanStartConversations } from '../../lib/collections/conversations/collection';
import { forumTypeSetting } from '../../lib/instanceSettings';
import qs from 'qs';
import { useMulti } from '../../lib/crud/withMulti';
import { useDialog } from '../common/withDialog';

interface TemplateQueryStrings {
  templateCommentId: string;
  firstName: string;
  displayName: string;
}

// Button used to start a new conversation for a given user
const NewConversationButton = ({ user, currentUser, children, from, includeModerators, templateQueries, setEmbeddedConversation }: {
  user: {
    _id: string
  },
  currentUser: UsersCurrent|null,
  templateQueries?: TemplateQueryStrings,
  from?: string,
  children: any,
  includeModerators?: boolean,
  setEmbeddedConversation?: (conversationId: conversationIdFragment) => void
}) => {
  const { history } = useNavigation();
  const { openDialog } = useDialog()
  const { create: createConversation } = useCreate({
    collectionName: 'Conversations',
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
  
  const newConversation = useCallback(async (search, initiatingUser: UsersCurrent) =>  {
    const alignmentFields = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}

    let baseData = {
      participantIds:[user._id, initiatingUser._id], 
      ...alignmentFields
    }
    const data = includeModerators ? { moderator: true, ...baseData} : {...baseData}

    const response = await createConversation({data})
    const conversationId = response.data?.createConversation.data._id
    if (setEmbeddedConversation) {
      setEmbeddedConversation({_id: conversationId})
    } else {
      history.push({pathname: `/inbox/${conversationId}`, ...search})
    }
  }, [createConversation, user, history, includeModerators]);

  const existingConversationCheck = (initiatingUser: UsersCurrent) => () => {
    let searchParams: Array<string> = []
    if (templateQueries) {
      searchParams.push(qs.stringify(templateQueries))
    }
    if (from) {
      searchParams.push(`from=${from}`)
    }
    const search = searchParams.length > 0 ? {search:`?${searchParams.join('&')}`} : {}
    
    for (let conversation of (results ?? [])) {
      if (setEmbeddedConversation) {
        setEmbeddedConversation(conversation)
      } else {
        history.push({pathname: `/inbox/${conversation._id}`, ...search})
      }
      return
    }
    void newConversation(search, initiatingUser);
  }

  if (currentUser && !userCanStartConversations(currentUser)) return null
  
  // in this case we show the button, but we don't actually let them create a conversation with themselves
  if (currentUser?._id === user._id)
    return <div>
      {children}
    </div>
  
  return (
    <div onClick={currentUser ? existingConversationCheck(currentUser) : () => openDialog({componentName: "LoginPopup"})}>
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
