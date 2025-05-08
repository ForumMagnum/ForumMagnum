import { useUpdate } from '@/lib/crud/withUpdate';
import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import React from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { EditorFormComponent, useEditorFormCallbacks } from '../editor/EditorFormComponent';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { cancelButtonStyles, submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import { FormComponentCheckbox } from "../form-components/FormComponentCheckbox";

export const styles = defineStyles('CollectionsEditForm', (theme: ThemeType) => ({
  newOrEditForm: {
    maxWidth: 695,
    marginLeft: "auto",
    marginRight: 90,
    padding: 15,
    borderRadius: 2,
    marginBottom: "2em",

    "& form": {
      clear: "both",
      overflow: "auto",
    },
    "& .form-submit": {
      float: "right",
    },
    "& h3": {
      fontSize: "2em",
      marginBottom: "1em",
    },
    "& label.control-label": {
      display: "none",
    },
    "& .col-sm-9": {
      padding: 0,
    },
    "& .input-title input": {
      fontSize: "2em",
    },
  },
  editForm: {
    width: 700,
    marginLeft: "auto",
    marginRight: 75,
  },
  newForm: {
    border: theme.palette.border.normal,
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));

const CollectionsEditFormInner = ({ initialData, successCallback, cancelCallback }: {
  initialData: UpdateCollectionDataInput & { _id: string },
  successCallback: (doc: CollectionsPageFragment) => void,
  cancelCallback: () => void,
}) => {
  const classes = useStyles(styles);

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<CollectionsPageFragment>();

  const { mutate } = useUpdate({
    collectionName: 'Collections',
    fragmentName: 'CollectionsPageFragment',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmit: async ({ value, formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: CollectionsPageFragment;

        const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: updatedFields,
        });
        result = data?.updateCollection.data;

        onSuccessCallback.current?.(result);

        successCallback(result);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  return (
    <div className={classNames(classes.newOrEditForm, classes.editForm)}>
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
                formType='edit'
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallback}
                addOnSuccessCallback={addOnSuccessCallback}
                hintText={defaultEditorPlaceholder}
                fieldName="contents"
                collectionName="Collections"
                commentEditor={false}
                commentStyles={false}
                hideControls={false}
              />
            )}
          </form.Field>
        </div>

        <div className={classNames('input-title',classes.fieldWrapper)}>
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
          <form.Field name="slug">
            {(field) => (
              <MuiTextField
                field={field}
                label="Slug"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="gridImageId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Grid image ID"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="firstPageLink">
            {(field) => (
              <MuiTextField
                field={field}
                label="First page link"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="hideStartReadingButton">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide start reading button"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="noindex">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Noindex"
              />
            )}
          </form.Field>
        </div>

        <div className="form-submit">
          <Button
            className={classNames("form-cancel", classes.cancelButton)}
            onClick={(e) => {
              e.preventDefault();
              cancelCallback()
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
    </div>
  )
}

export const CollectionsEditForm = registerComponent('CollectionsEditForm', CollectionsEditFormInner);

declare global {
  interface ComponentTypes {
    CollectionsEditForm: typeof CollectionsEditForm
  }
}

