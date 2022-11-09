import React from 'react';
import { Components, registerComponent, getFragment } from '../../../lib/vulcan-lib';
import { Posts } from '../../../lib/collections/posts'
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: theme.palette.buttons.hoverGrayHighlight,
    }
  },
  submitButton: {
    color: theme.palette.secondary.main,
    float: 'right'
  },
});

const ModerationGuidelinesEditForm = ({ postId, onClose, classes }: {
  postId: string,
  onClose?: ()=>void,
  classes: ClassesType,
}) => {
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
    <Components.LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        Moderation Guidelines Edit Form
      </DialogTitle>
      <DialogContent>
        <Components.Typography variant="body2">
          Edit the moderation guidelines specific to this post:
        </Components.Typography>
        {/* TODO: fix unerlying issues so we don't need this weird addFields hack. Fields does not parse properly for non-admins */}
        <Components.WrappedSmartForm
          collection={Posts}
          documentId={postId}
          fields={['moderationGuidelines', 'moderationStyle']}
          queryFragment={getFragment("PostsEditQueryFragment")}
          mutationFragment={getFragment("PostsPage")}
          successCallback={onClose}
          formComponents={{
            FormSubmit: SubmitComponent,
            FormGroupLayout: Components.DefaultStyleFormGroup
          }}
          extraVariables={{
            version: 'String'
          }}
          extraVariablesValues={{
            version: 'draft'
          }}
        />
      </DialogContent>
    </Components.LWDialog>
  )
}

const ModerationGuidelinesEditFormComponent = registerComponent('ModerationGuidelinesEditForm', ModerationGuidelinesEditForm, {styles});

declare global {
  interface ComponentTypes {
    ModerationGuidelinesEditForm: typeof ModerationGuidelinesEditFormComponent
  }
}
