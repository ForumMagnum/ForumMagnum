import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { ContentStyles } from "../common/ContentStyles";
import { ContentItemBody } from "../common/ContentItemBody";
import { Loading } from "../vulcan-core/Loading";

const commentModerationWarningCommentIdSetting = new DatabasePublicSetting<string>('commentModerationWarningCommentId', '')

const styles = (theme: ThemeType) => ({
  root: {
    borderBottom: theme.palette.border.commentBorder,
    padding: 12,
    paddingRight: 28
  }
});

export const NewCommentModerationWarningInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
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

export const NewCommentModerationWarning = registerComponent('NewCommentModerationWarning', NewCommentModerationWarningInner, {styles});

declare global {
  interface ComponentTypes {
    NewCommentModerationWarning: typeof NewCommentModerationWarning
  }
}

