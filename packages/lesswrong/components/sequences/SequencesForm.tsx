import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { preferredHeadingCase } from "@/themes/forumTheme";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React, { useState } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { ImageUpload } from "@/components/form-components/ImageUpload";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { cancelButtonStyles, submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { EditSequenceTitle } from "@/components/sequenceEditor/EditSequenceTitle";
import { FormUserSelect } from "@/components/form-components/UserSelect";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { userIsAdmin, userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { LegacyFormGroupLayout } from "../tanstack-form-components/LegacyFormGroupLayout";
import LWTooltip from "../common/LWTooltip";
import Error404 from "../common/Error404";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const SequencesEditUpdateMutation = gql(`
  mutation updateSequenceSequencesForm($selector: SelectorInput!, $data: UpdateSequenceDataInput!) {
    updateSequence(selector: $selector, data: $data) {
      data {
        ...SequencesEdit
      }
    }
  }
`);

const SequencesEditMutation = gql(`
  mutation createSequenceSequencesForm($data: CreateSequenceDataInput!) {
    createSequence(data: $data) {
      data {
        ...SequencesEdit
      }
    }
  }
`);

const formStyles = defineStyles('SequencesForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));

export const SequencesForm = ({
  initialData,
  currentUser,
  onSuccess,
  onCancel,
}: {
  initialData?: UpdateSequenceDataInput & { _id: string };
  currentUser: UsersCurrent;
  onSuccess: (doc: SequencesEdit) => void;
  onCancel: () => void;
}) => {
  const classes = useStyles(formStyles);

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<SequencesEdit>();

  const [create] = useMutation(SequencesEditMutation);

  const [mutate] = useMutation(SequencesEditUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const defaultValues = {
    ...initialData,
    title: initialData?.title ?? '',
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: SequencesEdit;

        if (formType === 'new') {
          const { data } = await create({ variables: { data: formApi.state.values } });
          if (!data?.createSequence?.data) {
            throw new Error('Failed to create sequence');
          }
          result = data.createSequence.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: updatedFields
            }
          });
          if (!data?.updateSequence?.data) {
            throw new Error('Failed to update sequence');
          }
          result = data.updateSequence.data;
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
      <div className={classNames('form-input', 'input-title', classes.fieldWrapper)}>
        <form.Field name="title">
          {(field) => (
            <EditSequenceTitle
              field={field}
              placeholder={preferredHeadingCase("Sequence title")}
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('form-input', 'input-contents', 'form-component-EditorFormComponent', classes.fieldWrapper)}>
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
              collectionName="Sequences"
              commentEditor={false}
              commentStyles={false}
              hideControls={false}
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('form-input', 'input-bannerImageId', classes.fieldWrapper)}>
        <form.Field name="bannerImageId">
          {(field) => (
            <ImageUpload
              field={field}
              label="Banner Image"
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('form-input', 'input-gridImageId', classes.fieldWrapper)}>
        <form.Field name="gridImageId">
          {(field) => (
            <ImageUpload
              field={field}
              label="Card Image"
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('form-input', 'input-hideFromAuthorPage', classes.fieldWrapper)}>
        <form.Field name="hideFromAuthorPage">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Hide from my user profile"
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('form-input', 'input-draft', classes.fieldWrapper)}>
        <form.Field name="draft">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Draft"
            />
          )}
        </form.Field>
      </div>

      <div className={classNames('form-input', 'input-af', classes.fieldWrapper)}>
        <form.Field name="af">
          {(field) => (
            <FormComponentCheckbox
              field={field}
              label="Alignment Forum"
            />
          )}
        </form.Field>
      </div>

      {userIsAdminOrMod(currentUser) && <LegacyFormGroupLayout
        label={preferredHeadingCase("Admin Options")}
        startCollapsed={true}
        groupStyling
      >
        {userIsAdmin(currentUser) && <div className={classNames('form-input', 'input-userId', classes.fieldWrapper)}>
          <form.Field name="userId">
            {(field) => (
              <FormUserSelect
                field={field}
                label="Set author"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classNames('form-input', 'input-curatedOrder', classes.fieldWrapper)}>
          <form.Field name="curatedOrder">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="Curated order"
              />
            )}
          </form.Field>
        </div>}

        <div className={classNames('form-input', 'input-userProfileOrder', classes.fieldWrapper)}>
          <form.Field name="userProfileOrder">
            {(field) => (
              <MuiTextField
                field={field}
                type="number"
                label="User profile order"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classNames('form-input', 'input-canonicalCollectionSlug', classes.fieldWrapper)}>
          <form.Field name="canonicalCollectionSlug">
            {(field) => (
              <LWTooltip title="The machine-readable slug for the collection this sequence belongs to. Will affect links, so don't set it unless you have the slug exactly right." placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label={preferredHeadingCase("Collection Slug")}
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>}

        <div className={classNames('form-input', 'input-hidden', classes.fieldWrapper)}>
          <form.Field name="hidden">
            {(field) => (
              <LWTooltip title="Hidden sequences don't show up on lists/search results on this site, but can still be accessed directly by anyone" placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Hidden"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classNames('form-input', 'input-noindex', classes.fieldWrapper)}>
          <form.Field name="noindex">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Noindex"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      <LegacyFormGroupLayout
        label={preferredHeadingCase("Advanced Options")}
        startCollapsed={true}
        groupStyling
      >
        <div className={classNames('form-input', 'input-isDeleted', 'form-component-checkbox', classes.fieldWrapper)}>
          <form.Field name="isDeleted">
            {(field) => (
              <LWTooltip title="Make sure you want to delete this sequence - it will be completely hidden from the forum." placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Delete"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>

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
