import React, { useCallback } from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Conversations from '../../lib/collections/conversations/collection';
import { useCurrentUser } from '../common/withUser';

// Button used to start a new conversation for a given user
const NewConversationButton = ({ user, children }) => {
  const currentUser = useCurrentUser();
  const { create: createConversation } = useCreate({
    collection: Conversations,
    fragmentName: 'newConversationFragment',
  });
  const { history } = useNavigation();
  const newConversation = useCallback(async () => {
    const alignmentFields = getSetting('forumType') === 'AlignmentForum' ? {af: true} : {}

    const response = await createConversation({
      data: {participantIds:[user._id, currentUser!._id], ...alignmentFields},
    })
    const conversationId = response.data.createConversation.data._id
    history.push({pathname: `/inbox/${conversationId}`})
  }, [createConversation, user, currentUser, history]);

  if (currentUser) {
    return (
      <div onClick={newConversation}>
        {children}
      </div>
    )
  } else {
    return <Components.Loading />
  }
}

const NewConversationButtonComponent = registerComponent('NewConversationButton', NewConversationButton);

declare global {
  interface ComponentTypes {
    NewConversationButton: typeof NewConversationButtonComponent
  }
}

