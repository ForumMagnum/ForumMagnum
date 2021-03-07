import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Conversations from '../../lib/collections/conversations/collection';
import { forumTypeSetting } from '../../lib/instanceSettings';
import qs from 'qs';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';

// Button used to start a new conversation for a given user
const NewConversationButton = ({ user, currentUser, children, templateCommentId }: {
  user: UsersMinimumInfo,
  currentUser: UsersCurrent,
  templateCommentId?: string,
  children: any
}) => {
  const { create: createConversation } = useCreate({
    collection: Conversations,
    fragmentName: 'newConversationFragment',
  });
  const { history } = useNavigation();
  const newConversation = useCallback(async () => {
    const alignmentFields = forumTypeSetting.get() === 'AlignmentForum' ? {af: true} : {}

    const response = await createConversation({
      data: {participantIds:[user._id, currentUser?._id], ...alignmentFields},
    })
    const conversationId = response.data.createConversation.data._id
    const search = templateCommentId ? {search:`?${qs.stringify({templateCommentId: templateCommentId})}`} : {}
    history.push({pathname: `/inbox/${conversationId}`, ...search})
  }, [createConversation, user, currentUser, history, templateCommentId]);

  // Check for already existing Conversation
  // would like to put this in an extra function, but useMulti is not accessible from there 
  let existingConversationObject;
  const terms: ConversationsViewTerms = {view: 'userConversations', userId: currentUser._id, showArchive: true};
  const { results } = useMulti({  
    terms,
    collectionName: "Conversations",
    fragmentName: 'conversationsListFragment',
    fetchPolicy: 'cache-and-network',
    limit: 200,
  });
  if (results != undefined){                //there is a reload happening at some point, after which the value gets assigned
  results.forEach(conversation => {
    if (conversation.title === null && conversation.participants.some(participant => participant._id === user._id)){
      existingConversationObject = conversation;
    }
  })
  }
 // End of Check

  if (currentUser) {
    return (
      <div onClick={existingConversationObject === undefined ? newConversation : undefined}>
        {existingConversationObject === undefined ? children : <Link to={`/inbox/${existingConversationObject._id}`}>Message</Link>}
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

