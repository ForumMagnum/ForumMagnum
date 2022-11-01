import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { forumSelect } from '../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
  moderationGuidelines: {
    ...theme.typography.body2,
    fontFamily: theme.typography.postStyle.fontFamily,
    '& a': {
      color: theme.palette.primary.main,
    }
  }
});

const NewUserGuidelinesDialog = ({classes, onClose, post, user}: {
  classes: ClassesType,
  onClose: () => void,
  post: PostsMinimumInfo,
  user: UsersCurrent
}) => {
  const { LWDialog } = Components;
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

  const dialogContent = forumSelect({
    LessWrong: <>
      <DialogTitle>
        Read this before commenting
      </DialogTitle>
      <DialogContent className={classes.moderationGuidelines}>
        <p>Welcome to LessWrong!</p>
        <p>We care a lot about making progress on art of human rationality and other important questions, and so have set very high standards for quality of writing on the site in comparison to many places on the web.</p>
        <p>To have well-received comments on LessWrong, we suggest spending some time learning from the example of content already on the site.</p>
        <p>We especially advise reading <Link to="/rationality">R:A-Z</Link> and <Link to="/codex">The Codex</Link>, since they help set the tone and standard for the site broadly.</p>
        <p>For more detail on LessWrong's purpose and values, see our <Link to="/about">About</Link> page.</p>
        <p>Otherwise look at highly upvoted posts and comments to see what to aim for when contributing here.</p>
      </DialogContent>
    </>,
    default: <></>
  });
  
  return (
    <LWDialog open={true}>
      {dialogContent}
      <DialogActions>
        <Button onClick={handleClick}>
          Acknowledge
        </Button>
      </DialogActions>
    </LWDialog>
  )
};

const NewUserGuidelinesDialogComponent = registerComponent('NewUserGuidelinesDialog', NewUserGuidelinesDialog, { styles });

declare global {
  interface ComponentTypes {
    NewUserGuidelinesDialog: typeof NewUserGuidelinesDialogComponent
  }
}
