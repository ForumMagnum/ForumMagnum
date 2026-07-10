import Button from '@/lib/vendor/@material-ui/core/src/Button';
import React from 'react';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { isLW, firstCommentAcknowledgeMessageCommentIdSetting } from '@/lib/instanceSettings';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { DialogActions } from '../widgets/DialogActions';
import LWDialog from "../common/LWDialog";
import { ContentItemBody } from "../contents/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import Loading from "../vulcan-core/Loading";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const CommentsListQuery = gql(`
  query NewUserGuidelinesDialog($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

const styles = defineStyles('NewUserGuidelinesDialog', (theme: ThemeType) => ({
  moderationGuidelines: {
    ...theme.typography.body2,
    padding: 30,
    fontFamily: theme.typography.postStyle.fontFamily,
    '& a': {
      color: theme.palette.primary.main,
    }
  }
}));

const NewUserGuidelinesDialog = ({onClose, post}: {
  onClose: () => void,
  post: PostsMinimumInfo,
}) => {
  const classes = useStyles(styles);
  const updateCurrentUser = useUpdateCurrentUser();
  const { recordEvent } = useNewEvents();

  const handleClick = () => {
    void updateCurrentUser({
      acknowledgedNewUserGuidelines: true
    });

    const eventProperties = {
      important: false,
      intercom: true,
      documentId: post._id,
    };

    recordEvent('acknowledged-new-user-guidelines', false, eventProperties);

    onClose();
  }
  
  const documentId = firstCommentAcknowledgeMessageCommentIdSetting.get()
  
  const { loading, data } = useQuery(CommentsListQuery, {
    variables: { documentId: documentId },
    skip: !documentId,
  });
  const document = data?.comment?.result;
  
  const { html = "" } = document?.contents || {}
  
  return (
    <AnalyticsContext pageSectionContext="firstCommentAcknowledgeDialog">
      <LWDialog open={true}>
        <ContentStyles contentType="post" className={classes.moderationGuidelines}>
          {loading && <Loading/>}
          {html &&  <ContentItemBody dangerouslySetInnerHTML={{__html: html }} />}
          {!html && !loading && <div className={classes.moderationGuidelines}><em>A moderator will need to review your account before your posts will appear publicly.</em></div>}
        </ContentStyles>
        <DialogActions>
          {isLW() && <Button>
            This was your father's rock
          </Button>}
          <Button onClick={handleClick}>
            I have read and understood
          </Button>
        </DialogActions>
      </LWDialog>
    </AnalyticsContext>
  )
};

export default NewUserGuidelinesDialog;


