import { userCanDeleteMultiDocument } from "@/lib/collections/multiDocuments/helpers";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { EditorFormComponent, useEditorFormCallbacks } from "../editor/EditorFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import Error404 from "../common/Error404";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const MultiDocumentContentDisplayUpdateMutation = gql(`
  mutation updateMultiDocumentSummaryForm($selector: SelectorInput!, $data: UpdateMultiDocumentDataInput!) {
    updateMultiDocument(selector: $selector, data: $data) {
      data {
        ...MultiDocumentContentDisplay
      }
    }
  }
`);

const MultiDocumentContentDisplayMutation = gql(`
  mutation createMultiDocumentSummaryForm($data: CreateMultiDocumentDataInput!) {
    createMultiDocument(data: $data) {
      data {
        ...MultiDocumentContentDisplay
      }
    }
  }
`);

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

type SummaryFormProps = ({
  initialData: UpdateMultiDocumentDataInput & { _id: string; userId: string; createdAt: Date; collectionName: MultiDocumentCollectionName; fieldName: CreateMultiDocumentDataInput['fieldName']; parentDocumentId: CreateMultiDocumentDataInput['parentDocumentId'] };
  prefilledProps?: undefined;
} | {
  initialData?: undefined;
  prefilledProps: {
    parentDocumentId: string;
    collectionName: 'MultiDocuments' | 'Tags';
  };
}) & {
  onSuccess: (doc: MultiDocumentContentDisplay) => void;
  onCancel: () => void;
};

export const SummaryForm = ({
  initialData,
  prefilledProps,
  onSuccess,
  onCancel,
}: SummaryFormProps) => {
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<MultiDocumentContentDisplay>();

  const [create] = useMutation(MultiDocumentContentDisplayMutation);

  const [mutate] = useMutation(MultiDocumentContentDisplayUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const defaultValues = {
    ...initialData,
    ...(formType === 'new' ? prefilledProps : {}),
  };

  const defaultValuesWithRequiredFields = {
    ...defaultValues,
    collectionName: defaultValues.collectionName ?? 'Tags',
    fieldName: defaultValues.fieldName ?? 'summary',
    parentDocumentId: defaultValues.parentDocumentId ?? '',
    tabTitle: defaultValues.tabTitle ?? '',
  };
    

  const form = useForm({
    defaultValues: defaultValuesWithRequiredFields,
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: MultiDocumentContentDisplay;

        if (formType === 'new') {
          const { data } = await create({ variables: { data: formApi.state.values } });
          if (!data?.createMultiDocument?.data) {
            throw new Error('Failed to create multi document');
          }
          result = data.createMultiDocument.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: updatedFields
            }
          });
          if (!data?.updateMultiDocument?.data) {
            throw new Error('Failed to update multi document');
          }
          result = data.updateMultiDocument.data;
        }

        onSuccessCallback.current?.(result);

        onSuccess(result);
        setCaughtError(undefined);
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
      <div className={classes.defaultFormSection}>
        <div className='input-tabTitle'>
          <form.Field name="tabTitle">
            {(field) => (
              <MuiTextField
                field={field}
                label="Tab title"
              />
            )}
          </form.Field>
        </div>

        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="contents">
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
              <FormComponentCheckbox
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
