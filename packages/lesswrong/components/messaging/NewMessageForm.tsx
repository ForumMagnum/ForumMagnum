import React from 'react';
import Messages from '../../lib/collections/messages/collection';
import { getDraftMessageHtml } from '../../lib/collections/messages/helpers';
import { useSingle } from '../../lib/crud/withSingle';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { TemplateQueryStrings } from './NewConversationButton';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle
  },
});

export const NewMessageForm = ({classes, conversationId, templateQueries, successEvent}: {
  classes: ClassesType,
  conversationId: string,
  templateQueries?: TemplateQueryStrings,
  successEvent: () => void
}) => {
  const { WrappedSmartForm, Loading, Error404 } = Components

  const { document: template, loading: loadingTemplate } = useSingle({
    documentId: templateQueries?.templateCommentId,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    skip: !templateQueries
  });
  
  if (loadingTemplate) return <Loading/>
  if (templateQueries?.templateCommentId && !template) return <Error404/>

  const templateHtml = template?.contents?.html && getDraftMessageHtml({html: template.contents.html, displayName: templateQueries?.displayName })

  return <div className={classes.root}>
    <WrappedSmartForm
      collection={Messages}
      prefilledProps={{
        conversationId,
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: templateHtml
          }
        }
      }}
      mutationFragment={getFragment("messageListFragment")}
      successCallback={successEvent}
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

