import React from 'react';
import { DialogContent } from '../../widgets/DialogContent';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classNames from 'classnames';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { EditablePost } from '@/lib/collections/posts/helpers';
import { useForm } from '@tanstack/react-form';
import { EditorFormComponent, useEditorFormCallbacks } from '@/components/editor/EditorFormComponent';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { useUpdate } from '@/lib/crud/withUpdate';
import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import { FormComponentSelect } from '@/components/form-components/FormComponentSelect';
import { MODERATION_GUIDELINES_OPTIONS } from '@/lib/collections/posts/constants';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import LWDialog from "../../common/LWDialog";
import { Typography } from "../../common/Typography";
import Loading from "../../vulcan-core/Loading";
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@apollo/client';

const postsEditQuery = gql(`
  query PostsEditQuery($documentId: String!, $version: String) {
    post(selector:  { documentId: $documentId }) {
      result {
        ...PostsEditQueryFragment
      }
    }
  }
`);

const tagsEditQuery = gql(`
  query TagEditQuery($documentId: String!) {
    tag(selector: { documentId: $documentId }) {
      result {
        ...TagEditFragment
      }
    }
  }
`);


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

interface ModerationGuidelinesFormProps {
  documentType: 'post' | 'subforum';
  initialData: EditablePost | UpdateTagDataInput & { _id: string };
  onSuccess?: () => void;
};

const PostModerationGuidelinesForm = ({
  documentType,
  initialData,
  onSuccess,
}: ModerationGuidelinesFormProps) => {
  const classes = useStyles(styles);
  
  const isPost = documentType === 'post';
  const formType = 'edit';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<PostsPage | TagWithFlagsFragment>();

  const { mutate } = useUpdate({
    collectionName: isPost ? 'Posts' : 'Tags',
    fragmentName: isPost ? 'PostsPage' : 'TagWithFlagsFragment',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result;

        const updatedFields = getUpdatedFieldValues(formApi, ['moderationGuidelines']);
        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: updatedFields,
        });
        result = data?.updatePost.data;

        onSuccessCallback.current?.(result);
        onSuccess?.();
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  return (<form className="vulcan-form" onSubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }}>
    {displayedErrorComponent}
    <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
      <form.Field name="moderationGuidelines">
        {(field) => (
          <EditorFormComponent
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
    {isPost && (
      <div className={classes.fieldWrapper}>
        <form.Field name="moderationStyle">
        {(field) => (
          <FormComponentSelect
            field={field}
            options={MODERATION_GUIDELINES_OPTIONS}
            label="Style"
          />
        )}
        </form.Field>
      </div>
    )}

    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <div className="form-submit">
          <Button
            type="submit"
            className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
            disabled={!canSubmit || isSubmitting}
          >
            Submit
          </Button>
        </div>
      )}
    </form.Subscribe>
  </form>);
};

export const ModerationGuidelinesEditForm = ({ commentType = "post", documentId, onClose }: {
  commentType?: "post" | "subforum",
  documentId: string,
  onClose?: () => void,
}) => {
  const isPost = commentType === "post";

  const { data: postData } = useQuery(postsEditQuery, {
    variables: {
      documentId,
      version: 'draft'
    },
    skip: !isPost
  });

  const { data: tagData } = useQuery(tagsEditQuery, {
    variables: {
      documentId,
    },
    skip: isPost
  });

  const editableDocument = isPost ? postData?.post?.result : tagData?.tag?.result;

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
        {!editableDocument && <Loading />}
        {editableDocument && (
          <PostModerationGuidelinesForm
            documentType={commentType}
            initialData={editableDocument}
            onSuccess={onClose}
          />
        )}
      </DialogContent>
    </LWDialog>
  )
}

export default registerComponent('ModerationGuidelinesEditForm', ModerationGuidelinesEditForm);


