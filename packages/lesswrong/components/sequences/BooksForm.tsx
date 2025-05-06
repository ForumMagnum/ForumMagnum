import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { Components } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { cancelButtonStyles, submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { PostsListEditor } from "@/components/form-components/PostsListEditor";
import { SequencesListEditor } from "@/components/form-components/SequencesListEditor";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";

const formStyles = defineStyles('BooksForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));

export const BooksForm = ({
  initialData,
  collectionId,
  onSuccess,
  onCancel,
}: {
  initialData?: UpdateBookDataInput & { _id: string };
  collectionId: string;
  onSuccess: (doc: BookPageFragment) => void;
  onCancel: () => void;
}) => {
  const { Error404, FormComponentCheckbox } = Components;
  const classes = useStyles(formStyles);

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<BookPageFragment>();

  const { create } = useCreate({
    collectionName: 'Books',
    fragmentName: 'BookPageFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'Books',
    fragmentName: 'BookPageFragment',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? { collectionId } : {}),
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: BookPageFragment;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createBook.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateBook.data;
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
              getLocalStorageId={(book, name) => {
                if (book._id) {
                  return {
                    id: `${book._id}_${name}`,
                    verify: true,
                  };
                }
                return {
                  id: `collection: ${book.collectionId}_${name}`,
                  verify: false,
                };
              }}
              hintText={defaultEditorPlaceholder}
              fieldName="contents"
              collectionName="Books"
              commentEditor={false}
              commentStyles={false}
              hideControls={false}
              />
            )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="title">
          {(field) => (
            <MuiTextField
              field={field}
              label="Title"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="subtitle">
          {(field) => (
            <MuiTextField
              field={field}
              label="Subtitle"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="tocTitle">
          {(field) => (
            <MuiTextField
              field={field}
              label="Toc title"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="collectionId">
          {(field) => (
            <MuiTextField
              field={field}
              label="Collection ID"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="number">
          {(field) => (
            <MuiTextField
              field={field}
              type="number"
              label="Number"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="postIds">
          {(field) => (
            <PostsListEditor
              field={field}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="sequenceIds">
          {(field) => (
            <SequencesListEditor
              field={field}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="displaySequencesAsGrid">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Display sequences as grid"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="hideProgressBar">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Hide progress bar"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="showChapters">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Show chapters"
            />
          )}
        </form.Field>
      </div>

      <div className="form-submit">
        <Button
          className={classNames("form-cancel", classes.cancelButton)}
          onClick={(e) => {
            e.preventDefault();
            onCancel?.();
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
