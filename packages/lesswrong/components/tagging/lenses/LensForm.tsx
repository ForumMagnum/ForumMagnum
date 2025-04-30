import { useCurrentUser } from "@/components/common/withUser";
import { useFormSubmitOnCmdEnter } from "@/components/hooks/useFormSubmitOnCmdEnter";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { useWarnAboutUnsavedChanges } from "@/components/hooks/useWarnAboutUnsavedChanges";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { FormComponentCheckbox } from "@/components/form-components/FormComponentCheckbox";
import { EditorFormComponent, useEditorFormCallbacks } from "@/components/editor/EditorFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { cancelButtonStyles, submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { userCanDeleteMultiDocument } from "@/lib/collections/multiDocuments/newSchema";
import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { Components } from "@/lib/vulcan-lib/components";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React, { useCallback, useState } from "react";

const formStyles = defineStyles('MultiDocumentsForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));

export const LensForm = ({
  initialData,
  parentDocumentId,
  onSuccess,
  onCancel,
  onChange,
}: {
  initialData?: UpdateMultiDocumentDataInput & { _id: string; userId: string; createdAt: Date };
  parentDocumentId?: string;
  onSuccess: (doc: MultiDocumentEdit) => void;
  onCancel: () => void;
  onChange?: () => void;
}) => {
  const { Error404, FormGroupLayout, FormGroupHeader, SummariesEditForm } = Components;
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();
  const [summariesGroupCollapsed, setSummariesGroupCollapsed] = useState(false);

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<MultiDocumentEdit>();

  const { create } = useCreate({
    collectionName: 'MultiDocuments',
    fragmentName: 'MultiDocumentEdit',
  });

  const { mutate } = useUpdate({
    collectionName: 'MultiDocuments',
    fragmentName: 'MultiDocumentEdit',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new'
          ? { parentDocumentId, collectionName: 'Tags' as const, fieldName: 'description' as const }
          : {}
        ),
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: MultiDocumentEdit;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createMultiDocument.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateMultiDocument.data;
        }

        onSuccessCallback.current?.(result);

        onSuccess(result);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  const checkIsFormDirty = useCallback(() => form.state.isDirty, [form.state.isDirty]);
  useWarnAboutUnsavedChanges(checkIsFormDirty);

  const handleSubmit = useCallback(() => form.handleSubmit(), [form]);
  const formRef = useFormSubmitOnCmdEnter(handleSubmit);
  
  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  return (
    <form className="vulcan-form" ref={formRef} onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}
      <div className={classNames('input-title', 'form-input', classes.fieldWrapper)}>
        <form.Field name="title">
          {(field) => (
            <MuiTextField
              field={field}
              label="Title"
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('input-tabTitle', 'form-input', classes.fieldWrapper)}>
        <form.Field name="tabTitle">
          {(field) => (
            <MuiTextField
              field={field}
              label="Tab title"
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('input-tabSubtitle', 'form-input', classes.fieldWrapper)}>
        <form.Field name="tabSubtitle">
          {(field) => (
            <MuiTextField
              field={field}
              label="Tab subtitle"
            />
          )}
        </form.Field>
      </div>

      {userIsAdmin(currentUser) && <div className={classNames('input-slug', 'form-input', classes.fieldWrapper)}>
        <form.Field name="slug">
          {(field) => (
            <MuiTextField
              field={field}
              label="Slug"
            />
          )}
        </form.Field>
      </div>}

      <div className={classNames("form-component-EditorFormComponent", 'form-input', classes.fieldWrapper)}>
        <form.Field name="contents" listeners={{ onChange }}>
          {(field) => (
            <EditorFormComponent
              field={field}
              name="contents"
              formType={formType}
              document={form.state.values}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
              getLocalStorageId={(multiDocument) => {
                const { _id, parentDocumentId, collectionName } = multiDocument;
                return {
                  id: `multiDocument:${collectionName}:${parentDocumentId}:${_id}`,
                  verify: false,
                };
              }}
              revisionsHaveCommitMessages={true}
              hintText={"New lens content goes here!"}
              fieldName="contents"
              collectionName="MultiDocuments"
              commentEditor={false}
              commentStyles={true}
              hideControls={false}
            />
          )}
        </form.Field>
      </div>

      {initialData && userCanDeleteMultiDocument(currentUser, initialData) && <div className={classNames('input-deleted', 'form-input', classes.fieldWrapper)}>
        <form.Field name="deleted">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Deleted"
            />
          )}
        </form.Field>
      </div>}

      {/* If we're editing a lens, then we want to show the summaries group, but not otherwise */}
      {initialData && <FormGroupLayout
        label="Summaries"
        collapsed={summariesGroupCollapsed}
        heading={<FormGroupHeader
          label="Summaries"
          collapsed={summariesGroupCollapsed}
          toggle={() => setSummariesGroupCollapsed(!summariesGroupCollapsed)}
        />}
        footer={<></>}
        hasErrors={false}
        groupStyling
      >
        <SummariesEditForm
          parentDocumentId={initialData._id}
          collectionName={'MultiDocuments'}
        />
      </FormGroupLayout>}

      <div className="form-submit">
        <Button
          className={classNames("form-cancel", classes.cancelButton)}
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          Cancel
        </Button>

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
