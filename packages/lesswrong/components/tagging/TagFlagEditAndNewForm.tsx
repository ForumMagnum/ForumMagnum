import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { DialogContent } from "@/components/widgets/DialogContent";
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import React from 'react';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { EditorFormComponent, useEditorFormCallbacks } from '../editor/EditorFormComponent';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import Error404 from "../common/Error404";
import LWDialog from "../common/LWDialog";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const TagFlagFragmentUpdateMutation = gql(`
  mutation updateTagFlagTagFlagEditAndNewForm($selector: SelectorInput!, $data: UpdateTagFlagDataInput!) {
    updateTagFlag(selector: $selector, data: $data) {
      data {
        ...TagFlagFragment
      }
    }
  }
`);

const TagFlagFragmentMutation = gql(`
  mutation createTagFlagTagFlagEditAndNewForm($data: CreateTagFlagDataInput!) {
    createTagFlag(data: $data) {
      data {
        ...TagFlagFragment
      }
    }
  }
`);

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
  const classes = useStyles(formStyles);

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<TagFlagFragment>();

  const [create] = useMutation(TagFlagFragmentMutation);

  const [mutate] = useMutation(TagFlagFragmentUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      name: initialData?.name ?? '',
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: TagFlagFragment;

        if (formType === 'new') {
          const { data } = await create({ variables: { data: formApi.state.values } });
          if (!data?.createTagFlag?.data) {
            throw new Error('Failed to create tag flag');
          }
          result = data.createTagFlag.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: updatedFields
            }
          });
          if (!data?.updateTagFlag?.data) {
            throw new Error('Failed to update tag flag');
          }
          result = data.updateTagFlag.data;
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
                <MuiTextField
                  field={field}
                  label="Name"
                />
              )}
            </form.Field>
          </div>

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
                <MuiTextField
                  field={field}
                  label="Slug"
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

export default registerComponent('TagFlagEditAndNewForm', TagFlagEditAndNewForm);


