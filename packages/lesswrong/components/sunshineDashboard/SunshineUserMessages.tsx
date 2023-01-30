import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';

const styles = (theme: JssStyles) => ({
  row: {
    display: "flex",
    alignItems: "center"
  }
})

export const SunshineUserMessages = ({classes, user, currentUser}: {
  user: SunshineUsersList,
  classes: ClassesType,
  currentUser: UsersCurrent,
}) => {
  const { ModeratorMessageCount, SunshineSendMessageWithDefaults, NewMessageForm } = Components
  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();

  const { captureEvent } = useTracking()

  const embedConversation = (conversationId: string, templateQueries: TemplateQueryStrings) => {
    setEmbeddedConversationId(conversationId)
    setTemplateQueries(templateQueries)
  }

  return <div className={classes.root}>
    <div className={classes.row}>
      <ModeratorMessageCount userId={user._id} />
      <SunshineSendMessageWithDefaults 
        user={user} 
        embedConversation={embedConversation}
      />
    </div>
    {embeddedConversationId && <div>
      <NewMessageForm 
        conversationId={embeddedConversationId} 
        templateQueries={templateQueries}
        successEvent={() => {
          captureEvent('messageSent', {
            conversationId: embeddedConversationId,
            sender: currentUser._id,
            moderatorConveration: true
          })
        }}
      />
    </div>}
  </div>;
}

const SunshineUserMessagesComponent = registerComponent('SunshineUserMessages', SunshineUserMessages, {styles});

declare global {
  interface ComponentTypes {
    SunshineUserMessages: typeof SunshineUserMessagesComponent
  }
}
