import React from 'react';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import Loading from "../vulcan-core/Loading";

const CommentsListQuery = gql(`
  query NewCommentModerationWarning($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

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
  const documentId = commentModerationWarningCommentIdSetting.get() 
  
  const { loading, data } = useQuery(CommentsListQuery, {
    variables: { documentId: documentId },
    skip: !documentId,
  });
  const document = data?.comment?.result;

  const { html = "" } = document?.contents || {}

  return <div className={classes.root}>
    <ContentStyles contentType="comment">
      {loading && <Loading/>}
      {html &&  <ContentItemBody dangerouslySetInnerHTML={{__html: html }} />}
      {!html && !loading && <div><em>A moderator will need to review your account before your comments will appear publicly.</em></div>}
    </ContentStyles>
  </div>;
}

export default registerComponent('NewCommentModerationWarning', NewCommentModerationWarning, {styles});



