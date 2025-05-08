import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { ImageUpload } from "@/components/form-components/ImageUpload";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import { FormComponentColorPicker } from "@/components/form-components/FormComponentColorPicker";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { LWTooltip } from "../common/LWTooltip";
import { Error404 } from "../common/Error404";
import { FormComponentCheckbox } from "../form-components/FormComponentCheckbox";

const formStyles = defineStyles('SpotlightForm', (theme: ThemeType) => ({
  defaultFormSection: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

export const SpotlightForm = ({
  initialData,
  descriptionOnly,
  onSuccess,
}: {
  initialData?: UpdateSpotlightDataInput & { _id: string; documentType: SpotlightDocumentType | null };
  descriptionOnly?: boolean;
  onSuccess: (doc: SpotlightEditQueryFragment) => void;
}) => {
  const classes = useStyles(formStyles);

  const formType = initialData ? 'edit' : 'new';

  const inputFieldClass = classNames('form-input', classes.fieldWrapper);

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<SpotlightEditQueryFragment>();

  const { create } = useCreate({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightEditQueryFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightEditQueryFragment',
  });

  const newFormDefaults = formType === 'new'
  ? { documentType: 'Sequence' as const, duration: 3, lastPromotedAt: new Date(0), draft: true, imageFade: true }
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
        let result: SpotlightEditQueryFragment;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createSpotlight.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['description']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateSpotlight.data;
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
        {!descriptionOnly && <>
          <div className={classNames('input-documentId', inputFieldClass)}>
            <form.Field name="documentId">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Document ID"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-documentType', inputFieldClass)}>
            <form.Field name="documentType">
              {(field) => (
                <FormComponentSelect
                  field={field}
                  options={[
                    { label: 'Sequence', value: 'Sequence' },
                    { label: 'Post', value: 'Post' },
                    { label: 'Tag', value: 'Tag' }
                  ]}
                  label="Document type"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-position', inputFieldClass)}>
            <form.Field name="position">
              {(field) => (
                <MuiTextField
                  field={field}
                  type="number"
                  label="Position"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-duration', inputFieldClass)}>
            <form.Field name="duration">
              {(field) => (
                <MuiTextField
                  field={field}
                  type="number"
                  label="Duration"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-customTitle', inputFieldClass)}>
            <form.Field name="customTitle">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Custom title"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-customSubtitle', inputFieldClass)}>
            <form.Field name="customSubtitle">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Custom subtitle"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-subtitleUrl', inputFieldClass)}>
            <form.Field name="subtitleUrl">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Subtitle url"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-headerTitle', inputFieldClass)}>
            <form.Field name="headerTitle">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Header title"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-headerTitleLeftColor', inputFieldClass)}>
            <form.Field name="headerTitleLeftColor">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Header title left color"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-headerTitleRightColor', inputFieldClass)}>
            <form.Field name="headerTitleRightColor">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Header title right color"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-lastPromotedAt', inputFieldClass)}>
            <form.Field name="lastPromotedAt">
              {(field) => (
                <FormComponentDatePicker
                  field={field}
                  label="Last promoted at"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-draft', inputFieldClass)}>
            <form.Field name="draft">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Draft"
                />
              )}
            </form.Field>
          </div>

          {formType === 'edit' && <div className={classNames('input-deletedDraft', inputFieldClass)}>
            <form.Field name="deletedDraft">
              {(field) => (
                <LWTooltip title="Remove from the spotlights page, but keep in the database." placement="left-start" inlineBlock={false}>
                  <FormComponentCheckbox
                    field={field}
                    label="Deleted draft"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>}

          <div className={classNames('input-showAuthor', inputFieldClass)}>
            <form.Field name="showAuthor">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Show author"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-imageFade', inputFieldClass)}>
            <form.Field name="imageFade">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Image fade"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-imageFadeColor', inputFieldClass)}>
            <form.Field name="imageFadeColor">
              {(field) => (
                <FormComponentColorPicker
                  field={field}
                  label="Image fade color"
                />
              )}
            </form.Field>
          </div>

          <div className={classNames('input-spotlightSplashImageUrl', inputFieldClass)}>
            <form.Field name="spotlightSplashImageUrl">
              {(field) => (
                <LWTooltip title="Note: Large images can cause slow loading of the front page. Consider using the Cloudinary uploader instead (which will automatically resize the image)" placement="left-start" inlineBlock={false}>
                  <MuiTextField
                    field={field}
                    label="Spotlight splash image url"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>

          <div className={classNames('input-spotlightImageId', inputFieldClass)}>
            <form.Field name="spotlightImageId">
              {(field) => (
                <ImageUpload
                  field={field}
                  label="Spotlight image ID"
                />
              )}
            </form.Field>
          </div>
        </>}


        <div className={classNames("form-component-EditorFormComponent", 'input-description', inputFieldClass)}>
          <form.Field name="description">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="description"
                formType={formType}
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallback}
                addOnSuccessCallback={addOnSuccessCallback}
                getLocalStorageId={(spotlight) => {
                  if (spotlight._id) {
                    return {
                      id: `spotlight:${spotlight._id}`,
                      verify: true,
                    };
                  }
                  return {
                    id: `spotlight:create`,
                    verify: true,
                  };
                }}
                hintText={defaultEditorPlaceholder}
                fieldName="description"
                collectionName="Spotlights"
                commentEditor={true}
                commentStyles={true}
                hideControls={true}
              />
            )}
          </form.Field>
        </div>

        {!descriptionOnly && <div className={classNames('input-spotlightDarkImageId', inputFieldClass)}>
          <form.Field name="spotlightDarkImageId">
            {(field) => (
              <ImageUpload
                field={field}
                label="Spotlight dark image ID"
              />
            )}
          </form.Field>
        </div>}
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
