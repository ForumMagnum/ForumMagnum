import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { Components } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React, { useState } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useEditorFormCallbacks, TanStackEditor } from "../tanstack-form-components/TanStackEditor";
import { TanStackMuiTextField } from "../tanstack-form-components/TanStackMuiTextField";
import { TanStackPostsListEditor } from "../tanstack-form-components/TanStackPostsListEditor";
import { cancelButtonStyles, submitButtonStyles } from "../tanstack-form-components/TanStackSubmit";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { getUpdatedFieldValues } from "../tanstack-form-components/helpers";

const formStyles = defineStyles('ChaptersForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));

export const ChaptersForm = ({
  initialData,
  prefilledProps,
  onSuccess,
  onCancel,
  onPostIdsChanged: onChange,
}: {
  initialData?: UpdateChapterDataInput & { _id: string };
  prefilledProps?: { sequenceId: string, number: number },
  onSuccess: (doc: ChaptersEdit) => void;
  onCancel?: () => void;
  onPostIdsChanged?: (newPostIds: string[]) => void;
}) => {
  const classes = useStyles(formStyles);
  const [detailsCollapsed, setDetailsCollapsed] = useState(true);
  const { Error404 } = Components;

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<typeof form.state.values, ChaptersEdit>();

  const { create } = useCreate({
    collectionName: 'Chapters',
    fragmentName: 'ChaptersEdit',
  });

  const { mutate } = useUpdate({
    collectionName: 'Chapters',
    fragmentName: 'ChaptersEdit',
  });

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' && prefilledProps ? prefilledProps : {}),
    },
    onSubmit: async ({ value, formApi }) => {
      await onSubmitCallback.current?.();

      let result: ChaptersEdit;

      if (formType === 'new') {
        const { data } = await create({ data: value });
        result = data?.createChapter.data;
      } else {
        const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: updatedFields,
        });
        result = data?.updateChapter.data;
      }

      if (onSuccessCallback.current) {
        result = onSuccessCallback.current(result, {});
      }

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
              getLocalStorageId={(chapter, name) => {
                if (chapter._id) {
                  return {
                    id: `${chapter._id}_${name}`,
                    verify: true,
                  };
                }
                return {
                  id: `sequence: ${chapter.sequenceId}_${name}`,
                  verify: false,
                };
              }}
              hintText={defaultEditorPlaceholder}
              fieldName="contents"
              collectionName="Chapters"
              commentEditor={false}
              commentStyles={false}
              hideControls={false}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="postIds" listeners={{ onChange: ({ value }) => onChange?.(value ?? []) }}>
          {(field) => (
            <TanStackPostsListEditor
              field={field}
            />
          )}
        </form.Field>
      </div>

      <Components.FormGroupLayout
        label="Chapter Details"
        groupStyling
        collapsed={detailsCollapsed}
        heading={<Components.FormGroupHeader
          label="Chapter Details"
          collapsed={detailsCollapsed}
          toggle={() => setDetailsCollapsed(!detailsCollapsed)}
        />}
        footer={<></>}
        hasErrors={false}
      >
        <div className={classes.fieldWrapper}>
          <form.Field name="title">
            {(field) => (
              <TanStackMuiTextField
                field={field}
                placeholder="Title"
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
                placeholder="Subtitle"
                label="Subtitle"
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
      </Components.FormGroupLayout>

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
