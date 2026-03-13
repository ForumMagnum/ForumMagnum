import React from 'react';
import { postModerationWarningCommentIdSetting } from '@/lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import Loading from "../vulcan-core/Loading";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const CommentsListQuery = gql(`
  query NewPostModerationWarning($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

const styles = defineStyles('NewPostModerationWarning', (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.commentBorder,
    padding: 24,
    marginBottom: 40
  }
}));

export const NewPostModerationWarning = () => {
  const classes = useStyles(styles);
  const documentId = postModerationWarningCommentIdSetting.get() 
  
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
      {!html && !loading && <div><em>A moderator will need to review your account before your posts will appear publicly.</em></div>}
    </ContentStyles>
  </div>;
}

export default registerComponent('NewPostModerationWarning', NewPostModerationWarning, {styles});



