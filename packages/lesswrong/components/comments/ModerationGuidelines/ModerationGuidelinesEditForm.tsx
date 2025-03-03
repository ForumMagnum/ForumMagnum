import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";


const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
}) => {
  const isPost = commentType === "post"
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
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
          queryFragmentName={isPost ? "PostsEditQueryFragment" : "TagEditFragment"}
          mutationFragmentName={isPost ? "PostsPage" : "TagWithFlagsFragment"}
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
