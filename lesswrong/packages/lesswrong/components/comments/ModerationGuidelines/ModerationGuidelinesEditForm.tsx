import React from 'react';
import classNames from 'classnames';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { getFragment } from "../../../lib/vulcan-lib/fragments";
import LWDialog from "@/components/common/LWDialog";
import FormGroupNoStyling from "@/components/form-components/FormGroupNoStyling";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";
import { Typography } from "@/components/common/Typography";
import { DialogContent, DialogTitle, Button } from "@/components/mui-replacement";

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
    <LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        Moderation Guidelines Edit Form
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Edit the moderation guidelines specific to this {commentType}:
        </Typography>
        <WrappedSmartForm
          collectionName={isPost ? "Posts" : "Tags"}
          documentId={documentId}
          fields={['moderationGuidelines', ...(isPost ? ['moderationStyle'] : [])]}
          queryFragment={getFragment(isPost ? "PostsEditQueryFragment" : "TagEditFragment")}
          mutationFragment={getFragment(isPost ? "PostsPage" : "TagWithFlagsFragment")}
          successCallback={onClose}
          formComponents={{
            FormSubmit: SubmitComponent,
            FormGroupLayout: FormGroupNoStyling
          }}
          extraVariables={isPost ? {
            version: 'String'
          } : {}}
          extraVariablesValues={isPost ? {
            version: 'draft'
          } : {}}
        />
      </DialogContent>
    </LWDialog>
  )
}

const ModerationGuidelinesEditFormComponent = registerComponent('ModerationGuidelinesEditForm', ModerationGuidelinesEditForm, {styles});

declare global {
  interface ComponentTypes {
    ModerationGuidelinesEditForm: typeof ModerationGuidelinesEditFormComponent
  }
}

export default ModerationGuidelinesEditFormComponent;
