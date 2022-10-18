import React from 'react';
import Messages from '../../lib/collections/messages/collection';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const NewMessageForm = ({classes, conversation, templateHtml}: {
  classes: ClassesType,
  conversation: ConversationsListFragment,
}) => {
  const { WrappedSmartForm } = Components
  return <div className={classes.root}>
    <WrappedSmartForm
      collection={Messages}
      prefilledProps={{
        conversationId: conversation._id,
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: templateHtml
          }
        }
      }}
      mutationFragment={getFragment("messageListFragment")}
      successCallback={() => {
        captureEvent('messageSent', {
          conversationId: conversation._id,
          sender: currentUser._id,
          participantIds: conversation.participantIds,
          messageCount: (conversation.messageCount || 0) + 1,
          ...(profileViewedFrom.current && {from: profileViewedFrom.current})
        })
      }}
      errorCallback={(message: any) => {
        //eslint-disable-next-line no-console
        console.error("Failed to send", message)
      }}
    />
  </div>
}

const NewMessageFormComponent = registerComponent('NewMessageForm', NewMessageForm, {styles});

declare global {
  interface ComponentTypes {
    NewMessageForm: typeof NewMessageFormComponent
  }
}

