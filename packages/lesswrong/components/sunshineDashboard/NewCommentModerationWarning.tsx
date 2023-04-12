import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const commentModerationWarningCommentIdSetting = new DatabasePublicSetting<string>('commentModerationWarningCommentId', '')

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    borderBottom: theme.palette.border.commentBorder,
    paddingLeft: 4,
    paddingBottom: 4,
    marginBottom: 16,
  }
});

export const NewCommentModerationWarning = ({classes}: {
  classes: ClassesType,
}) => {
  const { ContentStyles, ContentItemBody } = Components
  
  const documentId = commentModerationWarningCommentIdSetting.get() 
  
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
        <div><em>A moderator will need to review your account before your posts will appear publicly.</em></div>
      }
    </ContentStyles>
  </div>;
}

const NewCommentModerationWarningComponent = registerComponent('NewCommentModerationWarning', NewCommentModerationWarning, {styles});

declare global {
  interface ComponentTypes {
    NewCommentModerationWarning: typeof NewCommentModerationWarningComponent
  }
}

