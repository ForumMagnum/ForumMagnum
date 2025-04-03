import Button from '@/lib/vendor/@material-ui/core/src/Button';
import DialogActions from '@/lib/vendor/@material-ui/core/src/DialogActions';
import React from 'react';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useSingle } from "../../lib/crud/withSingle";
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isLW } from "../../lib/instanceSettings";

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
  const { LWDialog, ContentItemBody, ContentStyles, Loading } = Components;
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
  
  const {document, loading} = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !documentId
  });
  
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

const NewUserGuidelinesDialogComponent = registerComponent('NewUserGuidelinesDialog', NewUserGuidelinesDialog, { styles });

declare global {
  interface ComponentTypes {
    NewUserGuidelinesDialog: typeof NewUserGuidelinesDialogComponent
  }
}
