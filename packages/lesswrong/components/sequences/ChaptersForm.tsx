import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useEditorFormCallbacks, EditorFormComponent } from "../editor/EditorFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { PostsListEditor } from "@/components/form-components/PostsListEditor";
import { cancelButtonStyles, submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { LegacyFormGroupLayout } from "../tanstack-form-components/LegacyFormGroupLayout";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import Error404 from "../common/Error404";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const ChaptersEditUpdateMutation = gql(`
  mutation updateChapterChaptersForm($selector: SelectorInput!, $data: UpdateChapterDataInput!) {
    updateChapter(selector: $selector, data: $data) {
      data {
        ...ChaptersEdit
      }
    }
  }
`);

const ChaptersEditMutation = gql(`
  mutation createChapterChaptersForm($data: CreateChapterDataInput!) {
    createChapter(data: $data) {
      data {
        ...ChaptersEdit
      }
    }
  }
`);

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
  const currentUser = useCurrentUser();

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<ChaptersEdit>();

  const [create] = useMutation(ChaptersEditMutation);

  const [mutate] = useMutation(ChaptersEditUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const defaultValues = {
    ...initialData,
    ...(formType === 'new' && prefilledProps ? prefilledProps : {}),
  };

  const defaultValuesWithRequiredFields = {
    ...defaultValues,
    postIds: defaultValues.postIds ?? [],
  };

  const form = useForm({
    defaultValues: defaultValuesWithRequiredFields,
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: ChaptersEdit;

        if (formType === 'new') {
          const { data } = await create({ variables: { data: formApi.state.values } });
          if (!data?.createChapter?.data) {
            throw new Error('Failed to create chapter');
          }
          result = data.createChapter.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents']);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: updatedFields
            }
          });
          if (!data?.updateChapter?.data) {
            throw new Error('Failed to update chapter');
          }
          result = data.updateChapter.data;
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

      {/* 
        * The schema suggests that users who "own" a chapter should be allowed to update it, but chapters don't have userId fields.
        * Maybe that was always a bug.  If so, we can try to come back to it later to check for sequence ownership instead.
        * For now, maintain previous form behavior and only allow admins/mods to update chapter contents.
        */}
      {userIsAdminOrMod(currentUser) && <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
        <form.Field name="contents">
          {(field) => (
            <EditorFormComponent
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
      </div>}

      <div className={classes.fieldWrapper}>
        <form.Field name="postIds" listeners={{ onChange: ({ value }) => onChange?.(value ?? []) }}>
          {(field) => (
            <PostsListEditor
              field={field}
            />
          )}
        </form.Field>
      </div>

      <LegacyFormGroupLayout
        label="Chapter Details"
        groupStyling
        startCollapsed={true}
      >
        <div className={classes.fieldWrapper}>
          <form.Field name="title">
            {(field) => (
              <MuiTextField
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
              <MuiTextField
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
              <MuiTextField
                field={field}
                type="number"
                label="Number"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>

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
