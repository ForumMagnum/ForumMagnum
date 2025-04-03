import React, { PureComponent } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import { withMessages } from '../common/withMessages';
import DialogActions from '@/lib/vendor/@material-ui/core/src/DialogActions';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';

const styles = (theme: ThemeType) => ({
  modalTextField: {
    marginTop: 10,
  },
});

interface AFApplicationFormProps extends WithMessagesProps, WithStylesProps, WithUpdateCurrentUserProps {
  onClose: any,
}
interface AFApplicationFormState {
  applicationText: string,
}

class AFApplicationForm extends PureComponent<AFApplicationFormProps,AFApplicationFormState> {
  state: AFApplicationFormState = { applicationText: "" }

  handleSubmission = (event: React.MouseEvent<HTMLElement>) => {
    const { updateCurrentUser, flash, onClose } = this.props
    event.preventDefault();
    void updateCurrentUser({
      afSubmittedApplication: true,
      afApplicationText: this.state.applicationText,
    }).then(()=>{
      flash({messageString: "Successfully submitted application", type: "success"})
      onClose()
    }).catch(/* error */);
  }

  render() {
    const { onClose, classes } = this.props
    const { LWDialog } = Components;
    return (
      <LWDialog open={true} onClose={onClose}>
        <DialogTitle>
          AI Alignment Forum Membership Application
        </DialogTitle>
        <DialogContent>
          <p>
            We accept very few new members to the AI Alignment Forum. Instead, our usual suggestion is that visitors post to LessWrong.com, a large and vibrant intellectual community with a strong interest in alignment research, along with rationality, philosophy, and a wide variety of other topics.
          </p>
          <p>
            Posts and comments on LessWrong frequently get promoted to the AI Alignment Forum, where they'll automatically be visible to contributors here. We also use LessWrong as one of the main sources of new Alignment Forum members.
          </p>
          <p>
            If you have produced technical work on AI alignment, on LessWrong or elsewhere -- e.g., papers, blog posts, or comments -- you're welcome to link to it here so we can take it into account in any future decisions to expand the ranks of the AI Alignment Forum.
          </p>
          <br/>
          <TextField
            id="comment-menu-item-delete-reason"
            label="Write application text here"
            className={classes.modalTextField}
            value={this.state.applicationText}
            onChange={e => this.setState({applicationText:e.target.value})}
            fullWidth
            multiline
            rows={4}
            rowsMax={100}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={this.handleSubmission}>
            Submit Application
          </Button>
        </DialogActions>
      </LWDialog>
    )
  }
}

const AFApplicationFormComponent = registerComponent(
  'AFApplicationForm', AFApplicationForm, { styles, hocs: [
    withMessages,
    withUpdateCurrentUser,
  ]}
);

declare global {
  interface ComponentTypes {
    AFApplicationForm: typeof AFApplicationFormComponent
  }
}
