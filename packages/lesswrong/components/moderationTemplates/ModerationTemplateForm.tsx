import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { Components } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { EditorFormComponent, useEditorFormCallbacks } from "../editor/EditorFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { ALLOWABLE_COLLECTIONS, TemplateType } from "@/lib/collections/moderationTemplates/constants";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";

const formStyles = defineStyles('ModerationTemplatesForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

export const ModerationTemplatesForm = ({
  initialData,
  onSuccess,
}: {
  initialData?: UpdateModerationTemplateDataInput & { _id: string; collectionName: TemplateType };
  onSuccess?: (doc: ModerationTemplateFragment) => void;
}) => {
  const { Error404, FormComponentCheckbox } = Components;
  const classes = useStyles(formStyles);

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<ModerationTemplateFragment>();

  const { create } = useCreate({
    collectionName: 'ModerationTemplates',
    fragmentName: 'ModerationTemplateFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'ModerationTemplates',
    fragmentName: 'ModerationTemplateFragment',
  });

  const newFormDefaults = formType === 'new'
  ? { order: 10 }
  : {};

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...newFormDefaults,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: ModerationTemplateFragment;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createModerationTemplate.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateModerationTemplate.data;
        }

        onSuccessCallback.current?.(result);

        onSuccess?.(result);
        formApi.reset(newFormDefaults);
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
        <form.Field name="name">
          {(field) => (
            <MuiTextField
              field={field}
              label="Name"
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
              hintText={defaultEditorPlaceholder}
              fieldName="contents"
              collectionName="ModerationTemplates"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="collectionName">
          {(field) => (
            <FormComponentSelect
              field={field}
              options={ALLOWABLE_COLLECTIONS.map((collectionName) => ({
                label: collectionName,
                value: collectionName,
              }))}
              label="Collection name"
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="order">
          {(field) => (
            <MuiTextField
              field={field}
              type="number"
              label="Order"
            />
          )}
        </form.Field>
      </div>

      {formType === 'edit' && (
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
      )}

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
