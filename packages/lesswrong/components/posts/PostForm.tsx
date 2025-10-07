import { EditablePost, PostSubmitMeta } from "@/lib/collections/posts/helpers";
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { isLWorAF, isEAForum, fmCrosspostSiteNameSetting, fmCrosspostBaseUrlSetting } from "@/lib/instanceSettings";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { preferredHeadingCase } from "@/themes/forumTheme";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React, { useState } from "react";
import { useCurrentUser } from "../common/withUser";
import { EditLinkpostUrl } from "../editor/EditLinkpostUrl";
import { EditTitle } from "../editor/EditTitle";
import { PostSharingSettings } from "../editor/PostSharingSettings";
import { EditPostCategory } from "../form-components/EditPostCategory";
import { SelectLocalgroup } from "../form-components/SelectLocalgroup";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { LegacyFormGroupLayout } from "@/components/tanstack-form-components/LegacyFormGroupLayout";
import { EditorFormComponent, useEditorFormCallbacks } from "../editor/EditorFormComponent";
import { ImageUpload } from "@/components/form-components/ImageUpload";
import { LocationFormComponent } from "@/components/form-components/LocationFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { MultiSelectButtons } from "@/components/form-components/MultiSelectButtons";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { DialogueSubmit } from "./dialogues/DialogueSubmit";
import { PostSubmit } from "./PostSubmit";
import { SubmitToFrontpageCheckbox } from "./SubmitToFrontpageCheckbox";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import LWTooltip from "../common/LWTooltip";
import Error404 from "../common/Error404";
import FormGroupPostTopBar from "../form-components/FormGroupPostTopBar";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import PostFormSecondaryGroups from "./PostFormSecondaryGroups";
import { localGroupTypeFormOptions } from "@/lib/collections/localgroups/groupTypes";
import { EVENT_TYPES } from "@/lib/collections/posts/constants";

const PostsEditMutationFragmentUpdateMutation = gql(`
  mutation updatePostPostForm($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsEditMutationFragment
      }
    }
  }
`);

const PostsEditMutationFragmentMutation = gql(`
  mutation createPostPostForm($data: CreatePostDataInput!) {
    createPost(data: $data) {
      data {
        ...PostsEditMutationFragment
      }
    }
  }
`);

const formStyles = defineStyles('PostForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: 20,
  },
  submitButton: submitButtonStyles(theme),
}));

function getDraftLabel(post: { draft?: boolean | null } | null) {
  if (!post) return "Save Draft";
  if (!post.draft) return "Move to Drafts";
  return "Save Draft";
}

const ON_SUBMIT_META: PostSubmitMeta = {};

const PostForm = ({
  initialData,
  onSuccess,
}: {
  initialData: EditablePost;
  onSuccess: (doc: PostsEditMutationFragment, options?: { submitOptions: PostSubmitMeta }) => void;
}) => {
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();
  const [editorType, setEditorType] = useState<string>();

  // TODO: maybe this is just an edit form?
  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<PostsEditMutationFragment>();

  const {
    onSubmitCallback: onSubmitCallbackCustom,
    onSuccessCallback: onSuccessCallbackCustom,
    addOnSubmitCallback: addOnSubmitCallbackCustom,
    addOnSuccessCallback: addOnSuccessCallbackCustom
  } = useEditorFormCallbacks<PostsEditMutationFragment>();

  const {
    onSubmitCallback: onSubmitCallbackModerationGuidelines,
    onSuccessCallback: onSuccessCallbackModerationGuidelines,
    addOnSubmitCallback: addOnSubmitCallbackModerationGuidelines,
    addOnSuccessCallback: addOnSuccessCallbackModerationGuidelines
  } = useEditorFormCallbacks<PostsEditMutationFragment>();

  const [create] = useMutation(PostsEditMutationFragmentMutation);

  const [mutate] = useMutation(PostsEditMutationFragmentUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
      title: initialData?.title ?? "Untitled Draft",
    },
    onSubmitMeta: ON_SUBMIT_META,
    onSubmit: async ({ formApi, meta }) => {
      await Promise.all([
        onSubmitCallback.current?.(),
        onSubmitCallbackCustom.current?.(),
        onSubmitCallbackModerationGuidelines.current?.(),
      ]);

      try {
        let result: PostsEditMutationFragment;

        if (formType === 'new') {
          const { data } = await create({ variables: { data: formApi.state.values } });
          if (!data?.createPost?.data) {
            throw new Error('Failed to create post');
          }
          result = data.createPost.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents', 'customHighlight', 'moderationGuidelines']);
          const { data } = await mutate({
            variables: {
              selector: { _id: initialData?._id },
              data: updatedFields
            }
          });
          if (!data?.updatePost?.data) {
            throw new Error('Failed to update post');
          }
          result = data.updatePost.data;
        }

        onSuccessCallback.current?.(result, meta);
        onSuccessCallbackCustom.current?.(result, meta);
        onSuccessCallbackModerationGuidelines.current?.(result, meta);

        meta.successCallback?.(result);

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

  const isEvent = !!initialData.isEvent;
  const isDialogue = !!initialData.collabEditorDialogue;

  const hideSocialPreviewGroup = (isLWorAF() && !!initialData.collabEditorDialogue) || (isEAForum() && !!initialData.isEvent);

  const hideCrosspostControl = !fmCrosspostSiteNameSetting.get() || isEvent;
  const crosspostControlTooltip = fmCrosspostBaseUrlSetting.get()?.includes("forum.effectivealtruism.org")
    ? "The EA Forum is for discussions that are relevant to doing good effectively. If you're not sure what this means, consider exploring the Forum's Frontpage before posting on it."
    : undefined;

  const postSubmit = <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting, draft: s.values.draft })}>
    {({ canSubmit, isSubmitting, draft }) => {
      const draftLabel = getDraftLabel({ draft });
      const submitLabel = preferredHeadingCase(draft ? "Publish" : "Publish Changes");

      return isDialogue
        ? <DialogueSubmit
            formApi={form}
            disabled={!canSubmit || isSubmitting}
            submitLabel={submitLabel}
            saveDraftLabel={draftLabel}
          />
        : <div className={classes.formSubmit}>
            {!isEvent && <form.Field name="submitToFrontpage">
              {(field) => <SubmitToFrontpageCheckbox field={field} />}
            </form.Field>}
            <PostSubmit
              formApi={form}
              disabled={!canSubmit || isSubmitting}
              submitLabel={submitLabel}
              saveDraftLabel={draftLabel}
              feedbackLabel={"Get Feedback"}
            />
          </div>
    }}
  </form.Subscribe>;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}
      <FormGroupPostTopBar>
        {!(isEvent || isDialogue) && <div className={classNames('form-input', classes.fieldWrapper)}>
          <form.Field name="postCategory">
            {(field) => (
              <EditPostCategory
                field={field}
                post={form.state.values}
              />
            )}
          </form.Field>
        </div>}

        <div className={classNames('form-input', classes.fieldWrapper)}>
          <form.Field name="sharingSettings">
            {(field) => (
              <PostSharingSettings
                field={field}
                post={form.state.values}
                formType={formType}
                editorType={editorType}
              />
            )}
          </form.Field>
        </div>
      </FormGroupPostTopBar>

      <LegacyFormGroupLayout
        groupStyling={false}
        paddingStyling={true}
        flexAlignTopStyling={true}
      >
        <div className={'form-component-EditTitle'}>
          <form.Field name="title">
            {(field) => (
              <EditTitle
                field={field}
                document={form.state.values}
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>

      <form.Subscribe selector={(s) => ({ isLinkpost: s.values.postCategory === 'linkpost' })}>
        {({ isLinkpost }) => !(isEvent || isDialogue) && isLinkpost && (
          <LegacyFormGroupLayout
            groupStyling={false}
            paddingStyling={true}
            flexStyling={true}
          >
            <div className={classNames('form-input', 'input-url', classes.fieldWrapper)}>
              <form.Field name="url">
                {(field) => (
                  <EditLinkpostUrl
                    field={field}
                    post={form.state.values}
                  />
                )}
                </form.Field>
              </div>
          </LegacyFormGroupLayout>
        )}
      </form.Subscribe>

      <LegacyFormGroupLayout
        groupStyling={false}
        paddingStyling={true}
      >
        <div className={classNames('form-input', 'input-contents', 'form-component-EditorFormComponent', classes.fieldWrapper)}>
          <form.Field name="contents">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="contents"
                formType={formType}
                document={form.state.values}
                setFieldEditorType={setEditorType}
                addOnSubmitCallback={addOnSubmitCallback}
                addOnSuccessCallback={addOnSuccessCallback}
                hasToc={true}
                hintText={getDefaultEditorPlaceholder()}
                fieldName="contents"
                collectionName="Posts"
                commentEditor={false}
                commentStyles={false}
                hideControls={false}
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>

      {isEvent && <LegacyFormGroupLayout label={preferredHeadingCase("Event Details")}>
        <div className={classes.fieldWrapper}>
          <form.Field name="onlineEvent">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Online event"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="groupId">
            {(field) => (
              <SelectLocalgroup
                field={field}
                document={form.state.values}
                label="Group"
              />
            )}
          </form.Field>
        </div>

        {!isLWorAF() && <div className={classes.fieldWrapper}>
          <form.Field name="eventType">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={EVENT_TYPES}
                label="Event Format"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="activateRSVPs">
            {(field) => (
              <LWTooltip title="RSVPs are public, but the associated email addresses are only visible to organizers." placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Enable RSVPs for this event"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="startTime">
            {(field) => (
              <LWTooltip title="For courses/programs, this is the application deadline." placement="left-start" inlineBlock={false}>
                <FormComponentDatePicker
                  field={field}
                  label="Start Time"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        {form.state.values.eventType !== "course" && <div className={classes.fieldWrapper}>
          <form.Field name="endTime">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="End Time"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="eventRegistrationLink">
            {(field) => (
              <LWTooltip title="https://..." placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Event Registration Link"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="joinEventLink">
            {(field) => (
              <LWTooltip title="https://..." placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Join Online Event Link"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="globalEvent">
            {(field) => (
              <LWTooltip title="By default, events are only advertised to people who are located nearby (for both in-person and online events). Check this to advertise it people located anywhere." placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="This event is intended for a global audience"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="googleLocation">
            {(field) => (
              <LocationFormComponent
                field={field}
                stringVersionFieldName="location"
                label="Event Location"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="contactInfo">
            {(field) => (
              <MuiTextField
                field={field}
                label="Contact Info"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="facebookLink">
            {(field) => (
              <LWTooltip title="https://www.facebook.com/events/..." placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Facebook Event"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="meetupLink">
            {(field) => (
              <LWTooltip title="https://www.meetup.com/..." placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Meetup.com Event"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="website">
            {(field) => (
              <LWTooltip title="https://..." placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Website"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>

        {isEAForum() && <div className={classes.fieldWrapper}>
          <form.Field name="eventImageId">
            {(field) => (
              <LWTooltip title="Recommend 1920x1005 px, 1.91:1 aspect ratio (same as Facebook)" placement="left-start" inlineBlock={false}>
                <ImageUpload
                  field={field}
                  label="Event Image"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>}

        {isLWorAF() && <div className={classes.fieldWrapper}>
          <form.Field name="types">
            {(field) => (
              <MultiSelectButtons
                field={field}
                options={localGroupTypeFormOptions}
                label="Group Type:"
              />
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>}

      <PostFormSecondaryGroups
        form={form}
        initialData={initialData}
                    formType={formType}
        currentUser={currentUser}
        addOnSubmitCallbackCustom={addOnSubmitCallbackCustom}
        addOnSuccessCallbackCustom={addOnSuccessCallbackCustom}
        addOnSubmitCallbackModerationGuidelines={addOnSubmitCallbackModerationGuidelines}
        addOnSuccessCallbackModerationGuidelines={addOnSuccessCallbackModerationGuidelines}
      />

      {postSubmit}
    </form >
  );
};

export default registerComponent("PostForm", PostForm);


