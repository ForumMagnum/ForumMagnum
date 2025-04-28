import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { Components } from "@/lib/vulcan-lib/components";
import { useForm } from "@tanstack/react-form";
import React, { useState } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useEditorFormCallbacks, TanStackEditor } from "../tanstack-form-components/TanStackEditor";
import { TanStackMuiTextField } from "../tanstack-form-components/TanStackMuiTextField";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import classNames from "classnames";
import { getUpdatedFieldValues } from "../tanstack-form-components/helpers";

const formStyles = defineStyles('JargonTermForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  editorField: {
    marginBottom: 0,
    marginTop: 0,
    width: '100%',
  },
  formWrapper: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginBottom: 0,
    marginTop: 0,
    width: 150,
    marginRight: 20
  },
  submitWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: -6,
    justifyContent: 'end',
    height: 36,
  },
  submitButton: {
    color: theme.palette.secondary.main
  },
  cancelButton: {},
}));

const JargonSubmitButton = ({ submitForm, cancelCallback }: {
  submitForm: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  cancelCallback: () => void;
}) => {
  const { Loading } = Components;

  const classes = useStyles(formStyles);
  const [loading, setLoading] = useState(false);

  const wrappedSubmitForm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    await submitForm(e);
    setLoading(false);
  }

  return <div className={classes.submitWrapper}>
    {!loading && <Button onClick={cancelCallback} className={classes.cancelButton}>Cancel</Button>}
    {!loading && <Button onClick={wrappedSubmitForm} className={classes.submitButton}>Submit</Button>}
    {loading && <Loading />}
  </div>
};

export const JargonTermForm = ({
  initialData,
  postId,
  onSuccess,
  onCancel,
}: {
  initialData?: UpdateJargonTermDataInput & { _id: string };
  postId: string;
  onSuccess: (doc: JargonTerms) => void;
  onCancel: () => void;
}) => {
  const classes = useStyles(formStyles);
  const { LWTooltip, Error404 } = Components;

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<JargonTerms>();

  const { create } = useCreate({
    collectionName: 'JargonTerms',
    fragmentName: 'JargonTerms',
  });

  const { mutate } = useUpdate({
    collectionName: 'JargonTerms',
    fragmentName: 'JargonTerms',
  });

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? { postId } : {}),
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      let result: JargonTerms;

      if (formType === 'new') {
        const { data } = await create({ data: formApi.state.values });
        result = data?.createJargonTerm.data;
      } else {
        const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: updatedFields,
        });
        result = data?.updateJargonTerm.data;
      }

      onSuccessCallback.current?.(result);

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
      <div className={classes.formWrapper}>
        <div className={classNames('form-component-EditorFormComponent', classes.editorField)}>
          <form.Field name="contents">
            {(field) => (
              <TanStackEditor
                field={field}
                fieldName="contents"
                name="contents"
                collectionName="JargonTerms"
                formType={formType}
                document={form.state.values}
                hintText="If you want to add a custom term, use this form.  The description goes here.  The term, as well as any alt terms, must appear in your post."
                commentEditor={true}
                commentStyles={true}
                hideControls={true}
                addOnSubmitCallback={addOnSubmitCallback}
                addOnSuccessCallback={addOnSuccessCallback}
              />
            )}
          </form.Field>
        </div>

        <form.Field name="term">
          {(field) => (
            <TanStackMuiTextField
              field={field}
              label="Term"
              overrideClassName={classes.textField}
            />
          )}
        </form.Field>

        <form.Field name="altTerms">
          {(field) => (
            <LWTooltip title="Comma-separated, no spaces" placement="left-start" inlineBlock={false}>
              <TanStackMuiTextField
                field={field}
                label="Alternative Terms"
                overrideClassName={classes.textField}
              />
            </LWTooltip>
          )}
        </form.Field>
      </div>

      <div className="form-submit">
        <JargonSubmitButton submitForm={form.handleSubmit} cancelCallback={onCancel} />
      </div>
    </form>
  );
};
