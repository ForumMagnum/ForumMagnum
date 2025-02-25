import React, { MouseEvent, ReactNode, useCallback, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import qs from 'qs';
import { useDialog } from '../common/withDialog';
import { useNavigate } from '../../lib/routeUtil';
import { useInitiateConversation } from '../hooks/useInitiateConversation';
import { userCanStartConversations } from '../../lib/collections/conversations/collection';

export interface TemplateQueryStrings {
  templateId: string;
  displayName: string;
}

// Button used to start a new conversation for a given user
const NewConversationButton = ({
  user,
  currentUser,
  children,
  from,
  includeModerators,
  templateQueries,
  embedConversation,
  openInNewTab,
}: {
  user: {
    _id: string
  },
  currentUser: UsersCurrent|null,
  templateQueries?: TemplateQueryStrings,
  from?: string,
  children: ReactNode,
  includeModerators?: boolean,
  embedConversation?: (conversationId: string, templateQueries?: TemplateQueryStrings) => void
  openInNewTab?: boolean,
}) => {
  const navigate = useNavigate();
  const { openDialog } = useDialog()
  const { conversation, initiateConversation } = useInitiateConversation({ includeModerators })

  const getTemplateParams = useCallback(() => {
    let templateParams: Array<string> = []
    if (templateQueries) {
      templateParams.push(qs.stringify(templateQueries))
    }
    if (from) {
      templateParams.push(`from=${from}`)
    }
    return templateParams.length > 0 ? {search:`?${templateParams.join('&')}`} : {}
  }, [from, templateQueries])

  // Navigate to the conversation that is created
  useEffect(() => {
    if (!conversation) return;

    if (embedConversation) {
      embedConversation(conversation._id, templateQueries)
    } else {
      const templateParams = getTemplateParams()
      navigate({pathname: `/inbox/${conversation._id}`, ...templateParams}, {
        openInNewTab,
      });
    }
  }, [conversation, embedConversation, getTemplateParams, navigate, templateQueries, openInNewTab])

  const handleClick = currentUser
    ? (e: MouseEvent) => {
      initiateConversation([user._id])
      e.stopPropagation()
    }
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
