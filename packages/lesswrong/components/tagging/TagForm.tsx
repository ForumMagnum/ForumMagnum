import { userIsSubforumModerator, TAG_POSTS_SORT_ORDER_OPTIONS } from "@/lib/collections/tags/helpers";
import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { isEAForum, isLW, isLWorAF } from "@/lib/instanceSettings";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { userIsAdmin, userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { LegacyFormGroupLayout } from "@/components/tanstack-form-components/LegacyFormGroupLayout";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { EditorFormComponent, useEditorFormCallbacks } from "../editor/EditorFormComponent";
import { ImageUpload } from "@/components/form-components/ImageUpload";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import { cancelButtonStyles, submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { TagSelect } from "@/components/form-components/TagSelect";
import { FormUserMultiselect } from "@/components/form-components/UserMultiselect";
import SummariesEditForm from "./SummariesEditForm";
import { useCurrentUser } from "../common/withUser";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import LWTooltip from "../common/LWTooltip";
import Error404 from "../common/Error404";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";

const formStyles = defineStyles('TagForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
  cancelButton: cancelButtonStyles(theme),
}));

function showWikiOnlyField(currentUser: UsersCurrent | null, formType: 'new' | 'edit') {
  // LessWrong shows this field on the new tag form, but EA Forum does not
  if (formType === 'new') {
    return isLW || userIsAdminOrMod(currentUser);
  }

  return userIsAdminOrMod(currentUser);
}

type ShowSubforumWelcomeTextFieldProps = {
  currentUser: UsersCurrent | null;
} & ({
  editingTag?: never;
} | {
  editingTag: UpdateTagDataInput;
});

function showSubforumWelcomeTextField({ currentUser, editingTag }: ShowSubforumWelcomeTextFieldProps) {
  if (!isEAForum) {
    return false;
  }

  if (!editingTag) {
    return userIsAdminOrMod(currentUser);
  }

  let { subforumModeratorIds } = editingTag;
  subforumModeratorIds ??= [];

  return userIsSubforumModerator(currentUser, { subforumModeratorIds }) || userIsAdminOrMod(currentUser);
}

const wikiGradeDefinitions = {
  0: "Uncategorized",
  1: "Flagged",
  2: "Stub",
  3: "C-Class",
  4: "B-Class",
  5: "A-Class"
} satisfies Record<number, string>;

const wikiGradeOptions = Object.entries(wikiGradeDefinitions).map(([grade, name]) => ({
  value: parseInt(grade),
  label: name,
}));

export const TagForm = ({
  initialData,
  prefilledProps,
  onSuccess,
  onCancel,
  onChange,
}: {
  initialData?: UpdateTagDataInput & { _id: string; };
  prefilledProps?: {
    name: string;
    wikiOnly: boolean;
  };
  onSuccess: (doc: TagWithFlagsFragment) => void;
  onCancel?: () => void;
  onChange?: () => void;
}) => {
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();
  
  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<TagWithFlagsFragment>();

  const { create } = useCreate({
    collectionName: 'Tags',
    fragmentName: 'TagWithFlagsFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'Tags',
    fragmentName: 'TagWithFlagsFragment',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? prefilledProps : {}),
    },
    onSubmit: async ({ formApi }) => {
      await onSubmitCallback.current?.();

      try {
        let result: TagWithFlagsFragment;

        if (formType === 'new') {
          const { wikiOnly, ...rest } = formApi.state.values;
          const createData = showWikiOnlyField(currentUser, formType) ? { ...rest, wikiOnly } : rest;

          const { data } = await create({ data: createData });
          result = data?.createTag.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['description', 'moderationGuidelines', 'subforumWelcomeText']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updateTag.data;
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
        <form.Field name="description" listeners={{ onChange }}>
          {(field) => (
            <EditorFormComponent
              field={field}
              name="description"
              formType={formType}
              document={form.state.values}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
              getLocalStorageId={(tag) => {
                if (tag._id) {
                  return {
                    id: `tag:${tag._id}`,
                    verify: true,
                  };
                }
                return {
                  id: `tag:create`,
                  verify: true,
                };
              }}
              revisionsHaveCommitMessages={true}
              hintText={defaultEditorPlaceholder}
              fieldName="description"
              collectionName="Tags"
              commentEditor={false}
              commentStyles={true}
              hideControls={false}
            />
          )}
        </form.Field>
      </div>

      {userIsAdminOrMod(currentUser) && (
        <LegacyFormGroupLayout label="Advanced Options" startCollapsed={true}>
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
            <form.Field name="shortName">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Short name"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="subtitle">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Subtitle"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="core">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Core Tag (moderators check whether it applies when reviewing new posts)"
                />
              )}
            </form.Field>
          </div>

          {isEAForum && <div className={classes.fieldWrapper}>
            <form.Field name="isPostType">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Is post type"
                />
              )}
            </form.Field>
          </div>}

          <div className={classes.fieldWrapper}>
            <form.Field name="suggestedAsFilter">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Suggested Filter (appears as a default option in filter settings without having to use the search box)"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="defaultOrder">
              {(field) => (
                <LWTooltip title="Rank this wikitag higher in lists of wikitags?" placement="left-start" inlineBlock={false}>
                  <MuiTextField
                    field={field}
                    type="number"
                    label="Default order"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="descriptionTruncationCount">
              {(field) => (
                <MuiTextField
                  field={field}
                  type="number"
                  label="Description truncation count"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="adminOnly">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Admin Only"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="canEditUserIds">
              {(field) => (
                <LWTooltip title="Only these authors will be able to edit the topic" placement="left-start" inlineBlock={false}>
                  <FormUserMultiselect
                    field={field}
                    label="Restrict to these authors"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>

          {formType === 'edit' && <div className={classes.fieldWrapper}>
            <form.Field name="deleted">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Deleted"
                />
              )}
            </form.Field>
          </div>}

          {formType === 'edit' && <div className={classes.fieldWrapper}>
            <form.Field name="needsReview">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Needs review"
                />
              )}
            </form.Field>
          </div>}

          <div className={classes.fieldWrapper}>
            <form.Field name="wikiGrade">
              {(field) => (
                <FormComponentSelect
                  field={field}
                  options={wikiGradeOptions}
                  label="Wiki grade"
                />
              )}
            </form.Field>
          </div>

          {showWikiOnlyField(currentUser, formType) && <div className={classes.fieldWrapper}>
            <form.Field name="wikiOnly">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Wiki only"
                />
              )}
            </form.Field>
          </div>}

          {isEAForum && <div className={classes.fieldWrapper}>
            <form.Field name="bannerImageId">
              {(field) => (
                <LWTooltip title="Minimum 200x600 px" placement="left-start" inlineBlock={false}>
                  <ImageUpload
                    field={field}
                    label="Banner Image"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>}

          {isEAForum && <div className={classes.fieldWrapper}>
            <form.Field name="squareImageId">
              {(field) => (
                <LWTooltip title="Minimum 200x200 px" placement="left-start" inlineBlock={false}>
                  <ImageUpload
                    field={field}
                    label="Square Image"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>}

          <div className={classes.fieldWrapper}>
            <form.Field name="introSequenceId">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Intro sequence ID"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="postsDefaultSortOrder">
              {(field) => (
                <FormComponentSelect
                  field={field}
                  options={Object.entries(TAG_POSTS_SORT_ORDER_OPTIONS).map(([key, val]) => ({
                    value: key,
                    label: val.label,
                  }))}
                  label="Posts default sort order"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="canVoteOnRels">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Can vote on rels"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="isSubforum">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Is subforum"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="subforumModeratorIds">
              {(field) => (
                <FormUserMultiselect
                  field={field}
                  label="Subforum Moderators"
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="subforumIntroPostId">
              {(field) => (
                <LWTooltip title="Dismissable intro post that will appear at the top of the subforum feed" placement="left-start" inlineBlock={false}>
                  <MuiTextField
                    field={field}
                    label="Subforum intro post ID"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="parentTagId">
              {(field) => (
                <LWTooltip title="Parent tag which will also be applied whenever this tag is applied to a post for the first time" placement="left-start" inlineBlock={false}>
                  <TagSelect
                    field={field}
                    label="Parent Tag"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
            <form.Field name="autoTagModel">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Auto-tag classifier model ID"
                />
              )}
            </form.Field>
          </div>}

          {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
            <form.Field name="autoTagPrompt">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Auto-tag classifier prompt string"
                />
              )}
            </form.Field>
          </div>}

          {formType === 'edit' && <div className={classes.fieldWrapper}>
            <form.Field name="noindex">
              {(field) => (
                <LWTooltip title="Hide this wikitag from search engines" placement="left-start" inlineBlock={false}>
                  <FormComponentCheckbox
                    field={field}
                    label="No Index"
                  />
                </LWTooltip>
              )}
            </form.Field>
          </div>}

          <div className={classes.fieldWrapper}>
            <form.Field name="coreTagId">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Core tag ID"
                />
              )}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
            <form.Field name="forceAllowType3Audio">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Force Allow T3 Audio"
                />
              )}
            </form.Field>
          </div>}
        </LegacyFormGroupLayout>
      )}

      {showSubforumWelcomeTextField({ currentUser, editingTag: initialData }) && (
        <LegacyFormGroupLayout label="Sidebar Welcome Message" startCollapsed={true}>
          <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
            <form.Field name="subforumWelcomeText">
              {(field) => (
                <EditorFormComponent
                  field={field}
                  name="subforumWelcomeText"
                  formType={formType}
                  document={form.state.values}
                  addOnSubmitCallback={addOnSubmitCallback}
                  addOnSuccessCallback={addOnSuccessCallback}
                  hintText={defaultEditorPlaceholder}
                  fieldName="subforumWelcomeText"
                  collectionName="Tags"
                  commentEditor={false}
                  commentStyles={false}
                  hideControls={false}
                />
              )}
            </form.Field>
          </div>
        </LegacyFormGroupLayout>
      )}

      {initialData && isLWorAF && <LegacyFormGroupLayout label="Summaries" startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          {/* <form.Field name="summaries">
            {() => ( */}
              <SummariesEditForm
                parentDocumentId={initialData._id}
                collectionName='Tags'
              />
            {/* )}
          </form.Field> */}
        </div>
      </LegacyFormGroupLayout>}

      <div className="form-submit">
        {formType === 'edit' && <Button
          className={classNames("form-cancel", classes.cancelButton)}
          onClick={(e) => {
            e.preventDefault();
            onCancel?.();
          }}
        >
          Cancel
        </Button>}

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
