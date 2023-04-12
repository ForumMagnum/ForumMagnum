import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const postModerationWarningCommentIdSetting = new DatabasePublicSetting<string>('postModerationWarningCommentId', '')

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    border: theme.palette.border.commentBorder,
    padding: 24,
    marginBottom: 40
  }
});

export const NewPostModerationWarning = ({classes}: {
  classes: ClassesType,
}) => {
  const { ContentStyles, ContentItemBody } = Components

  const documentId = "" //postModerationWarningCommentIdSetting.get() 
  
  const {document} = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !documentId
  });

  const { html = "" } = document?.contents || {}

  return <div className={classes.root}>
    <ContentStyles contentType="comment" className={classes.modNote}>
      {html ? 
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: html }}
        />
        :
        <div><em>A moderator will need to review your account before your comments will appear publicly.</em></div>
      }
    </ContentStyles>
  </div>;
}

const NewPostModerationWarningComponent = registerComponent('NewPostModerationWarning', NewPostModerationWarning, {styles});

declare global {
  interface ComponentTypes {
    NewPostModerationWarning: typeof NewPostModerationWarningComponent
  }
}

