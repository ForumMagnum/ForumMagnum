import React from 'react';
import { DialogContent } from '../../widgets/DialogContent';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classNames from 'classnames';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { EditablePost } from '@/lib/collections/posts/helpers';
import { useForm } from '@tanstack/react-form';
import { TanStackEditor, useEditorFormCallbacks } from '@/components/tanstack-form-components/TanStackEditor';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { useUpdate } from '@/lib/crud/withUpdate';
import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import { TanStackSelect } from '@/components/tanstack-form-components/TanStackSelect';
import { MODERATION_GUIDELINES_OPTIONS } from '@/lib/collections/posts/constants';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ModerationGuidelinesEditForm', (theme: ThemeType) => ({
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
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
}));

const PostModerationGuidelinesForm = ({
  initialData,
  onSuccess,
}: {
  initialData: EditablePost;
  onSuccess: (doc: PostsPage) => void;
}) => {
  const classes = useStyles(styles);
  
  const formType = 'edit';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<typeof form.state.values, PostsPage>();

  const { mutate } = useUpdate({
    collectionName: 'Posts',
    fragmentName: 'PostsPage',
  });

  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      let result: PostsPage;

      const updatedFields = getUpdatedFieldValues(formApi, ['moderationGuidelines']);
      const { data } = await mutate({
        selector: { _id: initialData?._id },
        data: updatedFields,
      });
      result = data?.updatePost.data;

      onSuccessCallback.current?.(result);

      onSuccess(result);
    },
  });

  return (<>
    <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
      <form.Field name="moderationGuidelines">
        {(field) => (
          <TanStackEditor
            field={field}
            name="moderationGuidelines"
            formType={formType}
            document={form.state.values}
            addOnSubmitCallback={addOnSubmitCallback}
            addOnSuccessCallback={addOnSuccessCallback}
            hintText={defaultEditorPlaceholder}
            fieldName="moderationGuidelines"
            collectionName="Posts"
            commentEditor={true}
            commentStyles={true}
            hideControls={false}
          />
        )}
      </form.Field>
    </div>
    <div className={classes.fieldWrapper}>
      <form.Field name="moderationStyle">
        {(field) => (
          <TanStackSelect
            field={field}
            options={MODERATION_GUIDELINES_OPTIONS}
            label="Style"
          />
        )}
      </form.Field>
    </div>

    <div className="form-submit">
      <Button
        type="submit"
        className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
      >
        Submit
      </Button>
    </div>
  </>);
};

const ModerationGuidelinesEditForm = ({ commentType = "post", documentId, onClose }: {
  commentType?: "post" | "subforum",
  documentId: string,
  onClose?: () => void,
}) => {
  const classes = useStyles(styles);

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

const ModerationGuidelinesEditFormComponent = registerComponent('ModerationGuidelinesEditForm', ModerationGuidelinesEditForm);

declare global {
  interface ComponentTypes {
    ModerationGuidelinesEditForm: typeof ModerationGuidelinesEditFormComponent
  }
}
