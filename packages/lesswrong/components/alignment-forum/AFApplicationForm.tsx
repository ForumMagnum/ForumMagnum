import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';
import { DialogContent } from '../widgets/DialogContent';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import { DialogActions } from '../widgets/DialogActions';
import { LWDialog } from "../common/LWDialog";

const styles = (theme: ThemeType) => ({
  modalTextField: {
    marginTop: 10,
  },
});

interface ExternalProps {
  onClose: any,
}

interface AFApplicationFormProps extends ExternalProps, WithStylesProps {
}

const AFApplicationFormInner = ({ onClose, classes }: AFApplicationFormProps) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const { flash } = useMessages();
  const [applicationText, setApplicationText] = useState("");

  const handleSubmission = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    void updateCurrentUser({
      afSubmittedApplication: true,
      afApplicationText: applicationText,
    }).then(()=>{
      flash({messageString: "Successfully submitted application", type: "success"})
      onClose()
    }).catch(/* error */);
  };
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
          value={applicationText}
          onChange={e => setApplicationText(e.target.value)}
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
        <Button color="primary" onClick={handleSubmission}>
          Submit Application
        </Button>
      </DialogActions>
    </LWDialog>
  )
}

export const AFApplicationForm = registerComponent(
  'AFApplicationForm', AFApplicationFormInner, { styles }
);

declare global {
  interface ComponentTypes {
    AFApplicationForm: typeof AFApplicationForm
  }
}
