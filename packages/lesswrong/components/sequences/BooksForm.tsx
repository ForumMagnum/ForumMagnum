import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { Components } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { TanStackCheckbox } from "../tanstack-form-components/TanStackCheckbox";
import { useEditorFormCallbacks, TanStackEditor } from "../tanstack-form-components/TanStackEditor";
import { TanStackMuiTextField } from "../tanstack-form-components/TanStackMuiTextField";
import { cancelButtonStyles, submitButtonStyles } from "../tanstack-form-components/TanStackSubmit";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { TanStackPostsListEditor } from "../tanstack-form-components/TanStackPostsListEditor";
import { TanStackSequencesListEditor } from "../tanstack-form-components/TanStackSequencesListEditor";

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
  const classes = useStyles(formStyles);
  const { Error404 } = Components;

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<typeof form.state.values, BookPageFragment>();

  const { create } = useCreate({
    collectionName: 'Books',
    fragmentName: 'BookPageFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'Books',
    fragmentName: 'BookPageFragment',
  });

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? { collectionId } : {}),
    },
    onSubmit: async ({ value }) => {
      if (onSubmitCallback.current) {
        value = await onSubmitCallback.current(value);
      }

      let result: BookPageFragment;

      if (formType === 'new') {
        const { data } = await create({ data: value });
        result = data?.createBook.data;
      } else {
        const {
          collectionId, contents, displaySequencesAsGrid,
          hideProgressBar, number, postIds, sequenceIds,
          showChapters, subtitle, tocTitle, title
        } = value;

        const updateData = {
          collectionId, contents, displaySequencesAsGrid,
          hideProgressBar, number, postIds, sequenceIds,
          showChapters, subtitle, tocTitle, title
        };

        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: updateData,
        });
        result = data?.updateBook.data;
      }

      if (onSuccessCallback.current) {
        result = onSuccessCallback.current(result, {});
      }

      onSuccess?.(result);
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
            <TanStackMuiTextField
              field={field}
              label="Title"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="subtitle">
          {(field) => (
            <TanStackMuiTextField
              field={field}
              label="Subtitle"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="tocTitle">
          {(field) => (
            <TanStackMuiTextField
              field={field}
              label="Toc title"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="collectionId">
          {(field) => (
            <TanStackMuiTextField
              field={field}
              label="Collection ID"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="number">
          {(field) => (
            <TanStackMuiTextField
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
            <TanStackPostsListEditor
              field={field}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="sequenceIds">
          {(field) => (
            <TanStackSequencesListEditor
              field={field}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="displaySequencesAsGrid">
          {(field) => (
            <TanStackCheckbox
              field={field}
              label="Display sequences as grid"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="hideProgressBar">
          {(field) => (
            <TanStackCheckbox
              field={field}
              label="Hide progress bar"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="showChapters">
          {(field) => (
            <TanStackCheckbox
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
