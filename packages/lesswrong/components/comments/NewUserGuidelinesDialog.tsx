import Button from '@/lib/vendor/@material-ui/core/src/Button';
import React from 'react';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isLW } from "../../lib/instanceSettings";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { DialogActions } from '../widgets/DialogActions';
import LWDialog from "../common/LWDialog";
import { ContentItemBody } from "../contents/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import Loading from "../vulcan-core/Loading";


const CommentsListQuery = gql(`
  query NewUserGuidelinesDialog($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

const firstCommentAcknowledgeMessageCommentIdSetting = new DatabasePublicSetting<string>('firstCommentAcknowledgeMessageCommentId', '')

const styles = (theme: ThemeType) => ({
  moderationGuidelines: {
    ...theme.typography.body2,
    padding: 30,
    fontFamily: theme.typography.postStyle.fontFamily,
    '& a': {
      color: theme.palette.primary.main,
    }
  }
});

const NewUserGuidelinesDialog = ({classes, onClose, post, user}: {
  classes: ClassesType<typeof styles>,
  onClose: () => void,
  post: PostsMinimumInfo,
  user: UsersCurrent
}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const { recordEvent } = useNewEvents();

  const handleClick = () => {
    void updateCurrentUser({
      acknowledgedNewUserGuidelines: true
    });

    const eventProperties = {
      userId: user._id,
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
          {isLW && <Button>
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

export default registerComponent('NewUserGuidelinesDialog', NewUserGuidelinesDialog, { styles });


