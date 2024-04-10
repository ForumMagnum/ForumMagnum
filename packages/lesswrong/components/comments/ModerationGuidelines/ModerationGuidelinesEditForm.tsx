import React from 'react';
import { Components, registerComponent, getFragment } from '../../../lib/vulcan-lib';
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

const ModerationGuidelinesEditForm = ({ commentType = "post", documentId, onClose, classes }: {
  commentType?: "post" | "subforum",
  documentId: string,
  onClose?: () => void,
  classes: ClassesType,
}) => {
  const isPost = commentType === "post"
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
          Edit the moderation guidelines specific to this {commentType}:
        </Components.Typography>
        <Components.WrappedSmartForm
          collectionName={isPost ? "Posts" : "Tags"}
          documentId={documentId}
          fields={['moderationGuidelines', ...(isPost ? ['moderationStyle'] : [])]}
          queryFragment={getFragment(isPost ? "PostsEditQueryFragment" : "TagEditFragment")}
          mutationFragment={getFragment(isPost ? "PostsPage" : "TagWithFlagsFragment")}
          successCallback={onClose}
          formComponents={{
            FormSubmit: SubmitComponent,
            FormGroupLayout: Components.FormGroupNoStyling
          }}
          extraVariables={isPost ? {
            version: 'String'
          } : {}}
          extraVariablesValues={isPost ? {
            version: 'draft'
          } : {}}
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
