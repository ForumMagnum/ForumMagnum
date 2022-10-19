import React, { useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Conversations, { userCanStartConversations } from '../../lib/collections/conversations/collection';
import { forumTypeSetting } from '../../lib/instanceSettings';
import qs from 'qs';
import { useMulti } from '../../lib/crud/withMulti';
import { useDialog } from '../common/withDialog';

export interface TemplateQueryStrings {
  templateCommentId: string;
  displayName: string;
}

// Button used to start a new conversation for a given user
const NewConversationButton = ({ user, currentUser, children, from, includeModerators, templateQueries, embedConversation }: {
  user: {
    _id: string
  },
  currentUser: UsersCurrent|null,
  templateQueries?: TemplateQueryStrings,
  from?: string,
  children: any,
  includeModerators?: boolean,
  setEmbeddedConversation?: (conversationId: conversationIdFragment) => void,
  embedConversation?: (conversationId: string, templateQueries?: TemplateQueryStrings) => void
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

  const getTemplateParams = () => {
    let templateParams: Array<string> = []
    if (templateQueries) {
      templateParams.push(qs.stringify(templateQueries))
    }
    if (from) {
      templateParams.push(`from=${from}`)
    }
    return templateParams.length > 0 ? {search:`?${templateParams.join('&')}`} : {}
  }

  const newConversation = async (initiatingUser: UsersCurrent) => {
    const alignmentFields = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}
    const moderatorField = includeModerators ? { moderator: true } : {}

    const data = {
      participantIds:[user._id, initiatingUser._id], 
      ...alignmentFields,
      ...moderatorField
    }

    const response = await createConversation({data})
    return response.data?.createConversation.data._id
  }

  const openConversation = async (initiatingUser: UsersCurrent) => {
    const conversationId = results?.[0]?._id ?? await newConversation(initiatingUser)
    if (embedConversation) {
      embedConversation(conversationId, templateQueries)
    } else {
      const templateParams = getTemplateParams()
      history.push({pathname: `/inbox/${conversationId}`, ...templateParams})
    }
  }

  const handleClick = currentUser 
    ? () => openConversation(currentUser) 
    : () => openDialog({componentName: "LoginPopup"})

  if (currentUser && !userCanStartConversations(currentUser)) return null
  
  // in this case we show the button, but we don't actually let them create a conversation with themselves
  if (currentUser?._id === user._id)
    return <div>
      {children}
    </div>
  
  return (
    <div onClick={handleClick}>
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
