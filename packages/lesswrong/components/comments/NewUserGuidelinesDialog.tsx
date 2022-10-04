import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType): JssStyles => ({
  moderationGuidelines: {
    fontSize: "1.1rem",
    '& p, & ul': {
      marginTop: '.6em',
      marginBottom: '.6em'
    },
    '& li': {
      marginTop: '.4em',
      marginBottom: '.4em'
    },
    '& a': {
      color: theme.palette.primary.main,
    }
  }
})

const NewUserGuidelinesDialog = ({classes, onClose, post, user}: {
  classes: ClassesType,
  onClose: () => void,
  post: PostsMinimumInfo,
  user: UsersCurrent
}) => {
  const { LWDialog } = Components;
  const updateCurrentUser = useUpdateCurrentUser();
  const { recordEvent } = useNewEvents();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
  
  return (
    <LWDialog open={true}>
      <DialogTitle>
        New User?  Read this before commenting.
      </DialogTitle>
      <DialogContent className={classes.moderationGuidelines}>
        <p>Welcome to LessWrong!</p>
        <p>We care a lot about making progress on art of human rationality and other important questions, and so have set very high standards for quality of writing on the site in comparison to many places on the web.</p>
        <p>To have well-received comments on LessWrong, we suggest spending some time learning from the example of content already on the site.</p>
        <p>We especially advise reading <Link to="/rationality">R:A-Z</Link> and <Link to="/codex">The Codex</Link>, since they help set the tone and standard for the site broadly.</p>
        <p>Otherwise look at highly upvoted posts and comments to see what to aim for when contributing here.</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClick}>
          Acknowledged
        </Button>
      </DialogActions>
    </LWDialog>
  )
}

const NewUserGuidelinesDialogComponent = registerComponent('NewUserGuidelinesDialog', NewUserGuidelinesDialog, { styles });

declare global {
  interface ComponentTypes {
    NewUserGuidelinesDialog: typeof NewUserGuidelinesDialogComponent
  }
}
