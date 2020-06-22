import React from 'react';
import { Components, registerComponent, getFragment } from '../../../lib/vulcan-lib';
import { Posts } from '../../../lib/collections/posts'
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: "rgba(0,0,0, 0.05)",
    }
  },
  submitButton: {
    color: theme.palette.secondary.main,
    float: 'right'
  },
});

const ModerationGuidelinesEditForm = ({ postId, onClose, classes }) => {
  const SubmitComponent = ({submitLabel = "Submit"}) => {
    return <div className="form-submit">
      <Button
        type="submit"
        className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
      >
        {submitLabel}
      </Button>
    </div>
  }
  return (
    <Dialog
      open={true}
      onClose={onClose}
      disableEnforceFocus
    >
      <DialogTitle>
        Moderation Guidelines Edit Form
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Edit the moderation guidelines specific to this post:
        </Typography>
        {/* TODO: fix unerlying issues so we don't need this weird addFields hack. Fields does not parse properly for non-admins */}
        <Components.WrappedSmartForm
          collection={Posts}
          documentId={postId}
          fields={['moderationGuidelines', 'moderationStyle']}
          queryFragment={getFragment("PostsEdit")}
          mutationFragment={getFragment("PostsPage")}
          successCallback={onClose}
          formComponents={{
            FormSubmit: SubmitComponent,
            FormGroupLayout: Components.DefaultStyleFormGroup
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

const ModerationGuidelinesEditFormComponent = registerComponent('ModerationGuidelinesEditForm', ModerationGuidelinesEditForm, {styles});

declare global {
  interface ComponentTypes {
    ModerationGuidelinesEditForm: typeof ModerationGuidelinesEditFormComponent
  }
}
