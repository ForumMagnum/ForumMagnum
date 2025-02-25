import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const postModerationWarningCommentIdSetting = new DatabasePublicSetting<string>('postModerationWarningCommentId', '')

const styles = (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.commentBorder,
    padding: 24,
    marginBottom: 40
  }
});

export const NewPostModerationWarning = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { ContentStyles, ContentItemBody, Loading } = Components

  const documentId = postModerationWarningCommentIdSetting.get() 
  
  const {document, loading} = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !documentId
  });

  const { html = "" } = document?.contents || {}

  return <div className={classes.root}>
    <ContentStyles contentType="comment">
      {loading && <Loading/>}
      {html &&  <ContentItemBody dangerouslySetInnerHTML={{__html: html }} />}
      {!html && !loading && <div><em>A moderator will need to review your account before your posts will appear publicly.</em></div>}
    </ContentStyles>
  </div>;
}

const NewPostModerationWarningComponent = registerComponent('NewPostModerationWarning', NewPostModerationWarning, {styles});

declare global {
  interface ComponentTypes {
    NewPostModerationWarning: typeof NewPostModerationWarningComponent
  }
}

