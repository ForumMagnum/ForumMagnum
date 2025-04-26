import { userCanDeleteMultiDocument } from "@/lib/collections/multiDocuments/newSchema";
import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { Components } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { getUpdatedFieldValues } from "../tanstack-form-components/helpers";
import { TanStackCheckbox } from "../tanstack-form-components/TanStackCheckbox";
import { TanStackEditor, useEditorFormCallbacks } from "../tanstack-form-components/TanStackEditor";
import { TanStackMuiTextField } from "../tanstack-form-components/TanStackMuiTextField";

const formStyles = defineStyles('SummaryForm', (theme: ThemeType) => ({
  defaultFormSection: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: -6,
    justifyContent: 'end',
    height: 36,
  },
  submitButton: {
    color: theme.palette.secondary.main,
  },
}));

export const SummaryForm = ({
  initialData,
  prefilledProps,
  onSuccess,
  onCancel,
}: {
  initialData?: UpdateMultiDocumentDataInput & { _id: string; userId: string; createdAt: Date };
  prefilledProps?: {
    parentDocumentId: string;
    collectionName: 'MultiDocuments' | 'Tags';
  };
  onSuccess: (doc: MultiDocumentContentDisplay) => void;
  onCancel: () => void;
}) => {
  const { Error404 } = Components;
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<typeof form.state.values, MultiDocumentContentDisplay>();

  const { create } = useCreate({
    collectionName: 'MultiDocuments',
    fragmentName: 'MultiDocumentContentDisplay',
  });

  const { mutate } = useUpdate({
    collectionName: 'MultiDocuments',
    fragmentName: 'MultiDocumentContentDisplay',
  });

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? { ...prefilledProps, fieldName: 'summary' as const } : {}),
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      let result: MultiDocumentContentDisplay;

      if (formType === 'new') {
        const { data } = await create({ data: formApi.state.values });
        result = data?.createMultiDocument.data;
      } else {
        const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: updatedFields,
        });
        result = data?.updateMultiDocument.data;
      }

      onSuccessCallback.current?.(result);

      onSuccess(result);
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
      <div className={classes.defaultFormSection}>
        <div className='input-tabTitle'>
          <form.Field name="tabTitle">
            {(field) => (
              <TanStackMuiTextField
                field={field}
                label="Tab title"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="contents">
            {(field) => (
              <TanStackEditor
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
                hintText={"Write a custom summary to be displayed when users hover over links to this page."}
                fieldName="contents"
                collectionName="MultiDocuments"
                commentEditor={false}
                commentStyles={true}
                hideControls={false}
              />
            )}
          </form.Field>
        </div>

        {initialData && userCanDeleteMultiDocument(currentUser, initialData) && <div className={classes.fieldWrapper}>
          <form.Field name="deleted">
            {(field) => (
              <TanStackCheckbox
                field={field}
                label="Deleted"
              />
            )}
          </form.Field>
        </div>}
      </div>

      <div className={classNames("form-submit", classes.submitButtons)}>
        <Button
          className={classNames("form-cancel")}
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
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
              // This is explicitly not a submit button, because this form is nested inside another form
              // and we don't want to trigger the parent form's submit handler
              onClick={() => form.handleSubmit()}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
