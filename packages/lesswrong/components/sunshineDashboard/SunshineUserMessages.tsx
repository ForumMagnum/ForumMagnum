import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import {defaultModeratorPMsTagSlug} from "./SunshineNewUsersInfo";

const styles = (theme: JssStyles) => ({
  row: {
    display: "flex",
    alignItems: "center"
  },
  messageForm: {
    width: 500
  }
})

export const SunshineUserMessages = ({classes, user}: {
  user: SunshineUsersList,
  classes: ClassesType,
}) => {
  const { ModeratorMessageCount, SunshineSendMessageWithDefaults, NewMessageForm } = Components
  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  const currentUser = useCurrentUser()

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
    {embeddedConversationId && <div className={classes.messageForm}><NewMessageForm 
      conversationId={embeddedConversationId} 
      templateQueries={templateQueries}
      successEvent={() => {
        captureEvent('messageSent', {
          conversationId: embeddedConversationId,
          sender: currentUser?._id,
          moderatorConveration: true
        })
      }}
    /></div>}
  </div>;
}

const SunshineUserMessagesComponent = registerComponent('SunshineUserMessages', SunshineUserMessages, {styles});

declare global {
  interface ComponentTypes {
    SunshineUserMessages: typeof SunshineUserMessagesComponent
  }
}
