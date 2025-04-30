import { useCreate } from '@/lib/crud/withCreate';
import { useUpdate } from '@/lib/crud/withUpdate';
import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { DialogContent } from "@/components/widgets/DialogContent";
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import React from 'react';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { TanStackCheckbox } from '@/components/tanstack-form-components/TanStackCheckbox';
import { EditorFormComponent, useEditorFormCallbacks } from '../editor/EditorFormComponent';
import { TanStackMuiTextField } from '@/components/tanstack-form-components/TanStackMuiTextField';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';

const formStyles = defineStyles('TagFlagsForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

const TagFlagEditAndNewForm = ({ initialData, onClose }: {
  initialData?: UpdateTagFlagDataInput & { _id: string };
  onClose?: () => void,
}) => {
  const { Error404, LWDialog } = Components;
  const classes = useStyles(formStyles);

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<TagFlagFragment>();

  const { create } = useCreate({
    collectionName: 'TagFlags',
    fragmentName: 'TagFlagFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'TagFlags',
    fragmentName: 'TagFlagFragment',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: TagFlagFragment;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createTagFlag.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateTagFlag.data;
        }

        onSuccessCallback.current?.(result);

        onClose?.();
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  return (
    <LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        {initialData ?
          `Edit ${taggingNameCapitalSetting.get()} Flag` :
          `Create ${taggingNameCapitalSetting.get()} Flag`}
      </DialogTitle>
      <DialogContent>
        <form className="vulcan-form" onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}>
          {displayedErrorComponent}
          <div className={classes.fieldWrapper}>
            <form.Field name="name">
              {(field) => (
                <TanStackMuiTextField
                  field={field}
                  label="Name"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="deleted">
              {(field) => (
                <TanStackCheckbox
                  field={field}
                  label="Deleted"
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
                  getLocalStorageId={(tagFlag, name) => {
                    if (tagFlag._id) {
                      return {
                        id: `${tagFlag._id}_${name}`,
                        verify: true,
                      };
                    }
                    return {
                      id: `tagFlag: ${name}`,
                      verify: false,
                    };
                  }}
                  hintText={defaultEditorPlaceholder}
                  fieldName="contents"
                  collectionName="TagFlags"
                  commentEditor={false}
                  commentStyles={false}
                  hideControls={false}
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="slug">
              {(field) => (
                <TanStackMuiTextField
                  field={field}
                  label="Slug"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="order">
              {(field) => (
                <TanStackMuiTextField
                  field={field}
                  type="number"
                  label="Order"
                />
              )}
            </form.Field>
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
      </DialogContent>
    </LWDialog>
  )
}

const TagFlagEditAndNewFormComponent = registerComponent('TagFlagEditAndNewForm', TagFlagEditAndNewForm);

declare global {
  interface ComponentTypes {
    TagFlagEditAndNewForm: typeof TagFlagEditAndNewFormComponent
  }
}
