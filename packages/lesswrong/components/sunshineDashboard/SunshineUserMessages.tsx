import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import {defaultModeratorPMsTagSlug} from "./SunshineNewUsersInfo";

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const SunshineUserMessages = ({classes, user}: {
  user: SunshineUsersList,
  classes: ClassesType,
}) => {
  const { ModeratorMessageCount, SunshineSendMessageWithDefaults, NewMessageForm } = Components
  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateCommentId, setTemplateCommentId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  const currentUser = useCurrentUser()

  const { document: template, loading: loadingTemplate } = useSingle({
    documentId: templateCommentId,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    skip: !templateCommentId
  });
  
  const { captureEvent } = useTracking()

  const embedConversation = (conversationId, templateQueries) => {
    setEmbeddedConversationId(conversationId)
    setTemplateQueries(templateQueries)
  }

  return <div className={classes.root}>
    <div className={classes.row}>
      <ModeratorMessageCount userId={user._id} />
      <SunshineSendMessageWithDefaults 
        user={user} 
        tagSlug={defaultModeratorPMsTagSlug.get()} 
        embedConversation={embedConversation}
      />
    </div>
    {embeddedConversationId && <NewMessageForm 
      conversationId={embeddedConversationId} 
      templateQueries={templateQueries}
      successEvent={() => {
        captureEvent('messageSent', {
          conversationId: embeddedConversationId,
          sender: currentUser?._id,
          participantIds: conversation.participantIds,
          messageCount: (conversation.messageCount || 0) + 1,
          ...(profileViewedFrom?.current && {from: profileViewedFrom.current})
        })
      }}
    />}
  </div>;
}

const SunshineUserMessagesComponent = registerComponent('SunshineUserMessages', SunshineUserMessages, {styles});

declare global {
  interface ComponentTypes {
    SunshineUserMessages: typeof SunshineUserMessagesComponent
  }
}
