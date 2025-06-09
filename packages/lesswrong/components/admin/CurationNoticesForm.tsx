import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { EditorFormComponent, useEditorFormCallbacks } from "../editor/EditorFormComponent";
import { submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import Error404 from "../common/Error404";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const CurationNoticesFragmentUpdateMutation = gql(`
  mutation updateCurationNoticeCurationNoticesForm($selector: SelectorInput!, $data: UpdateCurationNoticeDataInput!) {
    updateCurationNotice(selector: $selector, data: $data) {
      data {
        ...CurationNoticesFragment
      }
    }
  }
`);

const CurationNoticesFragmentMutation = gql(`
  mutation createCurationNoticeCurationNoticesForm($data: CreateCurationNoticeDataInput!) {
    createCurationNotice(data: $data) {
      data {
        ...CurationNoticesFragment
      }
    }
  }
`);

interface CurationNoticesFormProps {
  initialData?: UpdateCurationNoticeDataInput & { _id: string; userId: string };
  currentUser: UsersCurrent;
  postId: string;
  onSuccess?: (doc: CurationNoticesFragment) => void;
}

const formStyles = defineStyles('CurationNoticesForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

export const CurationNoticesForm = ({
  initialData,
  currentUser,
  postId,
  onSuccess,
}: CurationNoticesFormProps) => {
  const classes = useStyles(formStyles);
  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<CurationNoticesFragment>();

  const [create] = useMutation(CurationNoticesFragmentMutation);

  const [mutate] = useMutation(CurationNoticesFragmentUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      // If we're editing an existing curation notice, the userId will be overwritten by the one in initialData
      userId: currentUser._id,
      ...initialData,
      postId,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: CurationNoticesFragment;

        if (formType === 'new') {
          const { data } = await create({ variables: { data: formApi.state.values } });
          if (!data?.createCurationNotice?.data) {
            throw new Error('Failed to create curation notice');
          }
          result = data.createCurationNotice.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: updatedFields
            }
          });
          if (!data?.updateCurationNotice?.data) {
            throw new Error('Failed to update curation notice');
          }
          result = data.updateCurationNotice.data;
        }

        onSuccessCallback.current?.(result);

        onSuccess?.(result);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}
      <div className={classes.fieldWrapper}>
        <form.Field name="contents">
          {(field) => (
            <EditorFormComponent
              field={field}
              document={form.state.values}
              formType={formType}
              hintText={defaultEditorPlaceholder}
              fieldName="contents"
              name="contents"
              collectionName="CurationNotices"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="deleted">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Deleted"
            />
          )}
        </form.Field>
      </div>

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
