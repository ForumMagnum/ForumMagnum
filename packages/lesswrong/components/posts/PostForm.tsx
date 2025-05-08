import { hasSidenotes, userCanCreateAndEditJargonTerms } from "@/lib/betas";
import { localGroupTypeFormOptions } from "@/lib/collections/localgroups/groupTypes";
import { MODERATION_GUIDELINES_OPTIONS, postStatusLabels, EVENT_TYPES } from "@/lib/collections/posts/constants";
import { EditablePost, postCanEditHideCommentKarma, PostSubmitMeta, MINIMUM_COAUTHOR_KARMA, userPassesCrosspostingKarmaThreshold, userCanEditCoauthors } from "@/lib/collections/posts/helpers";
import { useCreate } from "@/lib/crud/withCreate";
import { useUpdate } from "@/lib/crud/withUpdate";
import { defaultEditorPlaceholder } from "@/lib/editor/make_editable";
import { fmCrosspostBaseUrlSetting, fmCrosspostSiteNameSetting, isEAForum, isLWorAF, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from "@/lib/instanceSettings";
import { allOf } from "@/lib/utils/functionUtils";
import { getVotingSystems } from "@/lib/voting/getVotingSystem";
import { Components, registerComponent } from "@/lib/vulcan-lib/components";
import { userIsAdmin, userIsAdminOrMod, userIsMemberOf, userOverNKarmaOrApproved, userOwns } from "@/lib/vulcan-users/permissions";
import { isFriendlyUI, preferredHeadingCase } from "@/themes/forumTheme";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React, { useState } from "react";
import { useCurrentUser } from "../common/withUser";
import { EditLinkpostUrl } from "../editor/EditLinkpostUrl";
import { EditTitle } from "../editor/EditTitle";
import { PostSharingSettings } from "../editor/PostSharingSettings";
import { CoauthorsListEditor } from "../form-components/CoauthorsListEditor";
import { EditPostCategory } from "../form-components/EditPostCategory";
import { FMCrosspostControl } from "../form-components/FMCrosspostControl";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { FormComponentPostEditorTagging } from "../form-components/FormComponentPostEditorTagging";
import { PodcastEpisodeInput } from "../form-components/PodcastEpisodeInput";
import { SelectLocalgroup } from "../form-components/SelectLocalgroup";
import { SocialPreviewUpload } from "../form-components/SocialPreviewUpload";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { GlossaryEditFormWrapper } from "../jargon/GlossaryEditFormWrapper";
import { getUpdatedFieldValues } from "@/components/tanstack-form-components/helpers";
import { LegacyFormGroupLayout } from "@/components/tanstack-form-components/LegacyFormGroupLayout";
import { EditorFormComponent, useEditorFormCallbacks } from "../editor/EditorFormComponent";
import { ImageUpload } from "@/components/form-components/ImageUpload";
import { LocationFormComponent } from "@/components/form-components/LocationFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { MultiSelectButtons } from "@/components/form-components/MultiSelectButtons";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import { submitButtonStyles } from "@/components/tanstack-form-components/TanStackSubmit";
import { DialogueSubmit } from "./dialogues/DialogueSubmit";
import { PostSubmit } from "./PostSubmit";
import { SubmitToFrontpageCheckbox } from "./SubmitToFrontpageCheckbox";
import { useFormErrors } from "@/components/tanstack-form-components/BaseAppForm";
import { userCanCommentLock } from "@/lib/collections/users/helpers";

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

function getFooterTagListPostInfo(post: EditablePost) {
  const {
    _id, createdAt, tags, postCategory, isEvent,
    curatedDate = null,
    frontpageDate = null,
    reviewedByUserId = null,
  } = post;

  return { _id, createdAt, tags, curatedDate, frontpageDate, reviewedByUserId, postCategory, isEvent: isEvent ?? false };
}

function userCanEditCrosspostSettings(user: UsersCurrent | null) {
  return userIsAdmin(user) || allOf(userOwns, userPassesCrosspostingKarmaThreshold);
}

function getVotingSystemOptions(user: UsersCurrent | null) {
  const votingSystems = getVotingSystems();

  const filteredVotingSystems = user?.isAdmin
    ? votingSystems
    : votingSystems.filter((votingSystem) => votingSystem.userCanActivate);

  return filteredVotingSystems.map((votingSystem) => ({
    label: votingSystem.description,
    value: votingSystem.name,
  }));
}

function getDraftLabel(post: { draft?: boolean | null } | null) {
  if (!post) return "Save Draft";
  if (!post.draft) return "Move to Drafts";
  return "Save Draft";
}

const STICKY_PRIORITIES = {
  1: "Low",
  2: "Normal",
  3: "Elevated",
  4: "Max",
};

const ON_SUBMIT_META: PostSubmitMeta = {};

const PostFormInner = ({
  initialData,
  onSuccess,
}: {
  initialData: EditablePost;
  onSuccess: (doc: PostsEditMutationFragment, options?: { submitOptions: PostSubmitMeta }) => void;
}) => {
  const { LWTooltip, Error404, FormGroupPostTopBar, FooterTagList, FormComponentCheckbox } = Components;
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
    onSubmitCallback: onSubmitCallbackCustomHighlight,
    onSuccessCallback: onSuccessCallbackCustomHighlight,
    addOnSubmitCallback: addOnSubmitCallbackCustomHighlight,
    addOnSuccessCallback: addOnSuccessCallbackCustomHighlight
  } = useEditorFormCallbacks<PostsEditMutationFragment>();

  const {
    onSubmitCallback: onSubmitCallbackModerationGuidelines,
    onSuccessCallback: onSuccessCallbackModerationGuidelines,
    addOnSubmitCallback: addOnSubmitCallbackModerationGuidelines,
    addOnSuccessCallback: addOnSuccessCallbackModerationGuidelines
  } = useEditorFormCallbacks<PostsEditMutationFragment>();

  const { create } = useCreate({
    collectionName: 'Posts',
    fragmentName: 'PostsEditMutationFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'Posts',
    fragmentName: 'PostsEditMutationFragment',
  });

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmitMeta: ON_SUBMIT_META,
    onSubmit: async ({ formApi, meta }) => {
      await Promise.all([
        onSubmitCallback.current?.(),
        onSubmitCallbackCustomHighlight.current?.(),
        onSubmitCallbackModerationGuidelines.current?.(),
      ]);

      try {
        let result: PostsEditMutationFragment;

        if (formType === 'new') {
          const { data } = await create({ data: formApi.state.values });
          result = data?.createPost.data;
        } else {
          const updatedFields = getUpdatedFieldValues(formApi, ['contents', 'customHighlight', 'moderationGuidelines']);
          const { data } = await mutate({
            selector: { _id: initialData?._id },
            data: updatedFields,
          });
          result = data?.updatePost.data;
        }

        onSuccessCallback.current?.(result, meta);
        onSuccessCallbackCustomHighlight.current?.(result, meta);
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
  const showTagGroup = !isEvent && !(isLWorAF && isDialogue);

  const hideSocialPreviewGroup = (isLWorAF && !!initialData.collabEditorDialogue) || (isEAForum && !!initialData.isEvent);

  const hideCrosspostControl = !fmCrosspostSiteNameSetting.get() || isEvent || !userCanEditCrosspostSettings(currentUser);
  const crosspostControlTooltip = fmCrosspostBaseUrlSetting.get()?.includes("forum.effectivealtruism.org")
    ? "The EA Forum is for discussions that are relevant to doing good effectively. If you're not sure what this means, consider exploring the Forum's Frontpage before posting on it."
    : undefined;

  const tagGroup = showTagGroup && (
    <LegacyFormGroupLayout
      label={isEAForum ? `Set ${taggingNamePluralSetting.get()}` : `Apply ${taggingNamePluralCapitalSetting.get()}`}
      startCollapsed={false}
    >
      <div className={classes.fieldWrapper}>
        <form.Field name="tagRelevance">
          {(field) => (
            initialData && !initialData.draft
              ? <FooterTagList
                  post={getFooterTagListPostInfo(initialData)}
                  hideScore
                  hidePostTypeTag
                  showCoreTags
                  link={false}
                />
              : <FormComponentPostEditorTagging
                  field={field}
                  postCategory={form.state.values.postCategory}
                />
          )}
        </form.Field>
      </div>
    </LegacyFormGroupLayout>
  );

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
    <form className="vulcan-form" onSubmit={(e) => {
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
                hintText={defaultEditorPlaceholder}
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

      {isEAForum && tagGroup}

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

        {!isLWorAF && <div className={classes.fieldWrapper}>
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

        {isEAForum && <div className={classes.fieldWrapper}>
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

        {isLWorAF && <div className={classes.fieldWrapper}>
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

      {userCanEditCoauthors(currentUser) && <LegacyFormGroupLayout label="Coauthors" hideHeader>
        <div className={classes.fieldWrapper}>
          <form.Field name="coauthorStatuses">
            {(field) => (
              <CoauthorsListEditor
                field={field}
                post={form.state.values}
                label="Co-Authors"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {/* TODO: come back to this and figure out why the text field inside the social preview upload component isn't being (visually) populated initially */}
      {!hideSocialPreviewGroup && <LegacyFormGroupLayout label={preferredHeadingCase("Edit Link Preview")} startCollapsed={!isFriendlyUI}>
        <div className={classes.fieldWrapper}>
          <form.Field name="socialPreview">
            {(field) => (
              <SocialPreviewUpload
                field={field}
                post={form.state.values}
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {userIsAdminOrMod(currentUser) && <LegacyFormGroupLayout label="Highlight" startCollapsed={true}>
        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="customHighlight">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="customHighlight"
                formType={formType}
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallbackCustomHighlight}
                addOnSuccessCallback={addOnSuccessCallbackCustomHighlight}
                hintText={defaultEditorPlaceholder}
                fieldName="customHighlight"
                collectionName="Posts"
                commentEditor={false}
                commentStyles={false}
                hideControls={false}
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {userIsAdminOrMod(currentUser) && <LegacyFormGroupLayout label={preferredHeadingCase("Admin Options")} startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="sticky">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Sticky"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="metaSticky">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Sticky (Meta)"
              />
            )}
          </form.Field>
        </div>}

        {isLWorAF && (userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'alignmentForumAdmins')) && <div className={classes.fieldWrapper}>
          <form.Field name="afSticky">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Sticky (Alignment)"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="stickyPriority">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={Object.entries(STICKY_PRIORITIES).map(([level, name]) => ({
                  value: parseInt(level),
                  label: name,
                }))}
                label="Sticky priority"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="unlisted">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Make only accessible via link"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="legacy">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Legacy"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="disableRecommendation">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Exclude from Recommendations"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="forceAllowType3Audio">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Force allow type3 audio"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="defaultRecommendation">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Include in default recommendations"
              />
            )}
          </form.Field>
        </div>

        {isEAForum && <div className={classes.fieldWrapper}>
          <form.Field name="hideFromPopularComments">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide comments on this post from Popular Comments"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="slug">
            {(field) => (
              <MuiTextField
                field={field}
                label="Slug"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="postedAt">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Posted at"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="status">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={postStatusLabels}
                label="Status"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="userId">
            {(field) => (
              <LWTooltip title="The user id of the author" placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="User ID"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="authorIsUnreviewed">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Author is unreviewed"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="readTimeMinutesOverride">
            {(field) => (
              <LWTooltip title="By default, this is calculated from the word count. Enter a value to override." placement="left-start" inlineBlock={false}>
                <MuiTextField
                  field={field}
                  label="Read time (minutes)"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="canonicalSource">
            {(field) => (
              <MuiTextField
                field={field}
                label="Canonical source"
              />
            )}
          </form.Field>
        </div>}

        {isLWorAF && userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="manifoldReviewMarketId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Manifold review market ID"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="noIndex">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="No index"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="onlyVisibleToLoggedIn">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide this post from users who are not logged in"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="onlyVisibleToEstablishedAccounts">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide this post from logged out users and newly created accounts"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="hideFromRecentDiscussions">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide this post from recent discussions"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="votingSystem">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={getVotingSystemOptions(currentUser)}
                label="Voting system"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="feedId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Feed ID"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="feedLink">
            {(field) => (
              <MuiTextField
                field={field}
                label="Feed link"
              />
            )}
          </form.Field>
        </div>}

        {/* On the EA forum, only admins can set the curated date, not mods */}
        {(!isEAForum || userIsAdmin(currentUser)) && <div className={classes.fieldWrapper}>
          <form.Field name="curatedDate">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Curated date"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="metaDate">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Meta date"
              />
            )}
          </form.Field>
        </div>

        {(!isEAForum || userIsAdmin(currentUser)) && <div className={classes.fieldWrapper}>
          <form.Field name="reviewForCuratedUserId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Curated Review UserId"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="commentSortOrder">
            {(field) => (
              <MuiTextField
                field={field}
                label="Comment sort order"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="hideAuthor">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide author"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="swrCachingEnabled">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="stale-while-revalidate caching enabled"
              />
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>}

      {userIsAdminOrMod(currentUser) && <LegacyFormGroupLayout label={preferredHeadingCase("Canonical Sequence")} startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="collectionTitle">
            {(field) => (
              <MuiTextField
                field={field}
                label="Collection title"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="canonicalSequenceId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Canonical sequence ID"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="canonicalCollectionSlug">
            {(field) => (
              <MuiTextField
                field={field}
                label="Canonical collection slug"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="canonicalBookId">
            {(field) => (
              <MuiTextField
                field={field}
                label="Canonical book ID"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="canonicalNextPostSlug">
            {(field) => (
              <MuiTextField
                field={field}
                label="Canonical next post slug"
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="canonicalPrevPostSlug">
            {(field) => (
              <MuiTextField
                field={field}
                label="Canonical prev post slug"
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      <LegacyFormGroupLayout label="Options" startCollapsed={true}>
        {!hideCrosspostControl && <div className={classes.fieldWrapper}>
          <form.Field name="fmCrosspost">
            {(field) => (
              <LWTooltip title={crosspostControlTooltip}>
                <FMCrosspostControl
                  field={field}
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>}

        {(userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'alignmentForum')) && <div className={classes.fieldWrapper}>
          <form.Field name="af">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Alignment Forum"
              />
            )}
          </form.Field>
        </div>}

        {hasSidenotes && <div className={classes.fieldWrapper}>
          <form.Field name="disableSidenotes">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Disable sidenotes"
              />
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>

      {(userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'podcasters')) && <LegacyFormGroupLayout label="Audio" startCollapsed={true}>
        <div className={classes.fieldWrapper}>
          <form.Field name="podcastEpisodeId">
            {(field) => (
              <PodcastEpisodeInput
                field={field}
                document={form.state.values}
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      <LegacyFormGroupLayout
        label={preferredHeadingCase(isFriendlyUI ? "Moderation" : "Moderation Guidelines")}
        startCollapsed={true}
        tooltipText={isFriendlyUI ? undefined : "We prefill these moderation guidelines based on your user settings. But you can adjust them for each post."}
      >
        {!isFriendlyUI && <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="moderationGuidelines">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="moderationGuidelines"
                formType={formType}
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallbackModerationGuidelines}
                addOnSuccessCallback={addOnSuccessCallbackModerationGuidelines}
                hintText={defaultEditorPlaceholder}
                fieldName="moderationGuidelines"
                collectionName="Posts"
                commentEditor={true}
                commentStyles={true}
                hideControls={false}
              />
            )}
          </form.Field>
        </div>}

        {!isFriendlyUI && !isDialogue && <div className={classes.fieldWrapper}>
          <form.Field name="moderationStyle">
            {(field) => (
              <FormComponentSelect
                field={field}
                options={MODERATION_GUIDELINES_OPTIONS}
                label="Style"
              />
            )}
          </form.Field>
        </div>}

        {!isEAForum && !isDialogue && <div className={classes.fieldWrapper}>
          <form.Field name="ignoreRateLimits">
            {(field) => (
              <LWTooltip title="Allow rate-limited users to comment freely on this post" placement="left-start" inlineBlock={false}>
                <FormComponentCheckbox
                  field={field}
                  label="Ignore rate limits"
                />
              </LWTooltip>
            )}
          </form.Field>
        </div>}

        {userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="hideFrontpageComments">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide frontpage comments"
              />
            )}
          </form.Field>
        </div>}

        {userCanCommentLock(currentUser, { ...form.state.values, userId: form.state.values.userId ?? null }) && <div className={classes.fieldWrapper}>
          <form.Field name="commentsLocked">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Comments locked"
              />
            )}
          </form.Field>
        </div>}

        {userCanCommentLock(currentUser, { ...form.state.values, userId: form.state.values.userId ?? null }) && <div className={classes.fieldWrapper}>
          <form.Field name="commentsLockedToAccountsCreatedAfter">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Comments locked to accounts created after"
              />
            )}
          </form.Field>
        </div>}

        {isEAForum && (userIsAdmin(currentUser) || postCanEditHideCommentKarma(currentUser, form.state.values)) && <div className={classes.fieldWrapper}>
          <form.Field name="hideCommentKarma">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Hide comment karma"
              />
            )}
          </form.Field>
        </div>}
      </LegacyFormGroupLayout>

      {userCanCreateAndEditJargonTerms(currentUser) && <LegacyFormGroupLayout label="Glossary" startCollapsed={false} hideHeader>
        <div className={classes.fieldWrapper}>
          <form.Field name="glossary">
            {(field) => (
              <GlossaryEditFormWrapper
                document={form.state.values}
              />
            )}
          </form.Field>
        </div>
      </LegacyFormGroupLayout>}

      {!isEAForum && tagGroup}

      {postSubmit}
    </form >
  );
};

export const PostForm = registerComponent("PostForm", PostFormInner);

declare global {
  interface ComponentTypes {
    PostForm: typeof PostForm
  }
}
