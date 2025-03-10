import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const commentModerationWarningCommentIdSetting = new DatabasePublicSetting<string>('commentModerationWarningCommentId', '')

const styles = (theme: ThemeType) => ({
  root: {
    borderBottom: theme.palette.border.commentBorder,
    padding: 12,
    paddingRight: 28
  }
});

export const NewCommentModerationWarning = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { ContentStyles, ContentItemBody, Loading } = Components
  
  const documentId = commentModerationWarningCommentIdSetting.get() 
  
  const {document, loading } = useSingle({
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
      {!html && !loading && <div><em>A moderator will need to review your account before your comments will appear publicly.</em></div>}
    </ContentStyles>
  </div>;
}

const NewCommentModerationWarningComponent = registerComponent('NewCommentModerationWarning', NewCommentModerationWarning, {styles});

declare global {
  interface ComponentTypes {
    NewCommentModerationWarning: typeof NewCommentModerationWarningComponent
  }
}

