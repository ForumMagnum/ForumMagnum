import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { Components } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { TanStackCheckbox } from "../tanstack-form-components/TanStackCheckbox";
import { TanStackEditor, useEditorFormCallbacks } from "../tanstack-form-components/TanStackEditor";
import { submitButtonStyles } from "../tanstack-form-components/TanStackSubmit";
import { getUpdatedFieldValues } from "../tanstack-form-components/helpers";
import { useFormErrors } from "../tanstack-form-components/BaseAppForm";

interface CurationNoticesFormProps {
  initialData?: UpdateCurationNoticeDataInput & { _id: string; };
  currentUser: UsersCurrent;
  postId: string;
  onSuccess?: (doc: CurationNoticesFragment) => void;
}

const formStyles = defineStyles('TanStackCurationNoticesForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

export const CurationNoticesForm = ({
  initialData,
  currentUser,
  postId,
  onSuccess,
}: CurationNoticesFormProps) => {
  const classes = useStyles(formStyles);
  const { LWTooltip, Error404 } = Components;

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<CurationNoticesFragment>();

  const { create } = useCreate({
    collectionName: 'CurationNotices',
    fragmentName: 'CurationNoticesFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'CurationNotices',
    fragmentName: 'CurationNoticesFragment',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? {
        userId: currentUser._id,
        postId,
      } : {}),
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: CurationNoticesFragment;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createCurationNotice.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateCurationNotice.data;
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
      <div className={classes.fieldWrapper}>
        <form.Field name="contents">
          {(field) => (
            <TanStackEditor
              field={field}
              document={form.state.values}
              formType={formType}
              hintText={defaultEditorPlaceholder}
              fieldName="contents"
              name="contents"
              collectionName="CurationNotices"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
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
