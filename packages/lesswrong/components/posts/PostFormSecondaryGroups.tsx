import { hasSidenotes } from "@/lib/betas";
import { localGroupTypeFormOptions } from "@/lib/collections/localgroups/groupTypes";
import { MODERATION_GUIDELINES_OPTIONS, postStatusLabels, EVENT_TYPES } from "@/lib/collections/posts/constants";
import { EditablePost, postCanEditHideCommentKarma, PostSubmitMeta, userCanEditCoauthors, userPassesCrosspostingKarmaThreshold } from "@/lib/collections/posts/helpers";
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { fmCrosspostBaseUrlSetting, fmCrosspostSiteNameSetting, isEAForum, isLWorAF, taggingNamePluralCapitalSetting } from "@/lib/instanceSettings";
import { allOf } from "@/lib/utils/functionUtils";
import { getVotingSystems } from "@/lib/voting/getVotingSystem";
import { OwnableDocument, userIsAdmin, userIsAdminOrMod, userIsMemberOf, userOwns } from "@/lib/vulcan-users/permissions";
import { isFriendlyUI } from "@/themes/forumTheme";
import classNames from "classnames";
import React, { useState } from "react";
import { CoauthorsListEditor } from "../form-components/CoauthorsListEditor";
import { FMCrosspostControl } from "../form-components/FMCrosspostControl";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { FormComponentPostEditorTagging } from "../form-components/FormComponentPostEditorTagging";
import { PodcastEpisodeInput } from "../form-components/PodcastEpisodeInput";
import { SocialPreviewUpload } from "../form-components/SocialPreviewUpload";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { EditorFormComponent, useEditorFormCallbacks } from "../editor/EditorFormComponent";
import { MuiTextField } from "@/components/form-components/MuiTextField";
import { FormComponentSelect } from "@/components/form-components/FormComponentSelect";
import FooterTagList from "../tagging/FooterTagList";
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { commentBodyStyles } from "@/themes/stylePiping";
import LWTooltip from "../common/LWTooltip";
import { userCanCommentLock } from "@/lib/collections/users/helpers";
import { TypedReactFormApi } from "../tanstack-form-components/BaseAppForm";

const styles = defineStyles('PostFormSecondaryGroups', (theme: ThemeType) => ({
  secondaryOptions: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    gap: 8,
  },
  secondaryOptionLabel: {
    ...theme.typography.commentStyle,
    cursor: "pointer",
    padding: 8,
    paddingRight: 8,
    paddingLeft: 8,
    flexGrow: 1,
    textAlign: "center",
    [theme.breakpoints.down('xs')]: {
      padding: 6,
      border: theme.palette.border.grey300,
    },
    borderRadius: 2,
  },
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  secondaryOptionLabelActive: {
    border: `1px solid ${theme.palette.grey[300]}`,
    backgroundColor: theme.palette.grey[500],
    color: theme.palette.contrastText,
    [theme.breakpoints.up('sm')]: {
      borderBottom: `none`,
      marginBottom: -9,
      paddingBottom: 0,
      backgroundColor: theme.palette.background.pageActiveAreaBackground,
      color: theme.palette.text.normal,
    },
  },
  formGroup: {
    border: theme.palette.border.grey300,
    borderRadius: 2,
    padding: 24,
    paddingTop: 12,
    width: "100%",
    ...commentBodyStyles(theme),
  },
  formGroupTitle: {
    ...theme.typography.commentStyle,
    marginTop: 0,
    marginBottom: 24
  },
}));

function getFooterTagListPostInfo(post: EditablePost) {
  const {
    _id, tags, postCategory, isEvent,
    curatedDate = null,
    frontpageDate = null,
    reviewedByUserId = null,
  } = post;

  return {
    _id,
    tags,
    curatedDate: curatedDate?.toISOString() ?? null,
    frontpageDate: frontpageDate?.toISOString() ?? null,
    reviewedByUserId,
    postCategory,
    isEvent: isEvent ?? false,
  };
}

function userCanEditCrosspostSettings(user: UsersCurrent | null, document: OwnableDocument) {
  return userIsAdmin(user) || allOf(userOwns, userPassesCrosspostingKarmaThreshold)(user, document);
}

function getVotingSystemOptions(user: UsersCurrent | null) {
  const votingSystems = getVotingSystems();

  const filteredVotingSystems = user?.isAdmin
    ? votingSystems
    : votingSystems.filter((votingSystem) => votingSystem.userCanActivate?.());

  return filteredVotingSystems.map((votingSystem) => ({
    label: votingSystem.description,
    value: votingSystem.name,
  }));
}

const STICKY_PRIORITIES = {
  1: "Low",
  2: "Normal",
  3: "Elevated",
  4: "Max",
};

const PostFormSecondaryGroups = ({
  form,
  initialData,
  formType,
  currentUser,
  addOnSubmitCallbackCustom,
  addOnSuccessCallbackCustom,
  addOnSubmitCallbackModerationGuidelines,
  addOnSuccessCallbackModerationGuidelines,
}: {
  form: TypedReactFormApi<EditablePost, PostSubmitMeta>;
  initialData: EditablePost;
  formType: 'new' | 'edit';
  currentUser: UsersCurrent | null;
  addOnSubmitCallbackCustom: ReturnType<typeof useEditorFormCallbacks<PostsEditMutationFragment>>['addOnSubmitCallback'];
  addOnSuccessCallbackCustom: ReturnType<typeof useEditorFormCallbacks<PostsEditMutationFragment>>['addOnSuccessCallback'];
  addOnSubmitCallbackModerationGuidelines: ReturnType<typeof useEditorFormCallbacks<PostsEditMutationFragment>>['addOnSubmitCallback'];
  addOnSuccessCallbackModerationGuidelines: ReturnType<typeof useEditorFormCallbacks<PostsEditMutationFragment>>['addOnSuccessCallback'];
}) => {
  const classes = useStyles(styles);

  const isAdminOrMod = userIsAdminOrMod(currentUser);
  const canEditCoauthors = userCanEditCoauthors(currentUser);
  const canSeeHighlight = isAdminOrMod; // same condition as render guard
  const canSeeAdmin = isAdminOrMod;
  const canSeeEvent = isAdminOrMod;
  const canSeeAudio = userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'podcasters');
  const canSeeModeration = !isFriendlyUI();
  // const canSeeGlossary = userCanCreateAndEditJargonTerms(currentUser);
  const canSeeTags = !initialData.isEvent && !(isLWorAF() && !!initialData.collabEditorDialogue);
  const canSeeSocialPreview = !((isLWorAF() && !!initialData.collabEditorDialogue) || (isEAForum() && !!initialData.isEvent));

  type expandedFormGroupType = 'Tags' | 'Coauthors' | 'Link Preview' | 'Highlight' | 'Moderation' | 'Options' | 'Admin' | 'Event' | 'Audio' | 'Glossary';

  type expandedFormGroupLabelType = 'Apply WikiTags' | 'Add Co-Authors' | 'Link Preview' | 'Highlight' | 'Moderation' | 'Options' | 'Admin' | 'Event' | 'Audio' | 'Glossary';

  const allSecondaryFormGroups: Array<{label: expandedFormGroupType, title: expandedFormGroupLabelType, shortTitle?: expandedFormGroupLabelType}> = [
    {label: 'Tags', title: 'Apply WikiTags'},
    {label: 'Coauthors', title: 'Add Co-Authors'},
    {label: 'Link Preview', title: 'Link Preview'},
    {label: 'Highlight', title: 'Highlight'},
    {label: 'Moderation', title: 'Moderation'},
    {label: 'Options', title: 'Options'},
    {label: 'Admin', title: 'Admin'},
    {label: 'Event', title: 'Event'},
    {label: 'Audio', title: 'Audio'},
    // 'Glossary', // removed for now, will try improve Jargon generation someday
  ];

  const secondaryFormGroups = allSecondaryFormGroups.filter((group) => {
    switch (group.label) {
      case 'Tags':
        return canSeeTags;
      case 'Coauthors':
        return canEditCoauthors;
      case 'Link Preview':
        return canSeeSocialPreview;
      case 'Highlight':
        return canSeeHighlight;
      case 'Admin':
        return canSeeAdmin;
      case 'Event':
        return canSeeEvent;
      case 'Audio':
        return canSeeAudio;
      case 'Moderation':
        return canSeeModeration;
      // case 'Glossary':
      //   return canSeeGlossary;
      default:

        return true;
    }
  });
  const isEvent = !!initialData.isEvent;
  const isDialogue = !!initialData.collabEditorDialogue;

  const defaultExpandedFormGroup = isEvent ? 'Event' : secondaryFormGroups[0].label;

  const [expandedFormGroup, setExpandedFormGroup] = useState<expandedFormGroupType | undefined>(defaultExpandedFormGroup);

  const hideSocialPreviewGroup = (isLWorAF() && !!initialData.collabEditorDialogue) || (isEAForum() && !!initialData.isEvent);

  const hideCrosspostControl = !fmCrosspostSiteNameSetting.get() || isEvent;
  const crosspostControlTooltip = fmCrosspostBaseUrlSetting.get()?.includes("forum.effectivealtruism.org")
    ? "The EA Forum is for discussions that are relevant to doing good effectively. If you're not sure what this means, consider exploring the Forum's Frontpage before posting on it."
    : undefined;

  return (
    <>
      <div className={classes.secondaryOptions}>
        {secondaryFormGroups.map((group) => (
          <div key={group.label} className={classNames(classes.secondaryOptionLabel, { [classes.secondaryOptionLabelActive]: expandedFormGroup === group.label })} onClick={() => setExpandedFormGroup(group.label)}>
            {group.label}
          </div>
        ))}
      </div>
      <div>
        {expandedFormGroup === 'Tags' &&  <div className={classes.formGroup}>  
          <h3 className={classes.formGroupTitle}>Apply {taggingNamePluralCapitalSetting.get()}</h3>
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
      </div>}

        {expandedFormGroup === 'Coauthors' && userCanEditCoauthors(currentUser) && <div className={classes.formGroup}>
          <h3 className={classes.formGroupTitle}>Co-Authors</h3>
            <form.Field name="coauthorUserIds">
              {(field) => (
                <CoauthorsListEditor
                  field={field}
                  post={form.state.values}
                  label="Co-Authors"
                />
              )}
            </form.Field>
        </div>}

        {/* TODO: come back to this and figure out why the text field inside the social preview upload component isn't being (visually) populated initially */}
        {expandedFormGroup === 'Link Preview' && !hideSocialPreviewGroup && <div className={classes.formGroup}>
          <h3 className={classes.formGroupTitle}>Link Preview</h3>
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
        </div>}

        {expandedFormGroup === 'Highlight' && userIsAdminOrMod(currentUser) && <div className={classes.formGroup}>
          <h3 className={classes.formGroupTitle}>Highlight</h3>
          <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
            <form.Field name="customHighlight">
              {(field) => (
                <EditorFormComponent
                  field={field}
                  name="custom"
                  formType={formType}
                  document={form.state.values}
                  addOnSubmitCallback={addOnSubmitCallbackCustom}
                  addOnSuccessCallback={addOnSuccessCallbackCustom}
                  hintText={getDefaultEditorPlaceholder()}
                  fieldName="custom"
                  collectionName="Posts"
                  commentEditor={false}
                  commentStyles={false}
                  hideControls={false}
                />
              )}
            </form.Field>
          </div>
        </div>}

        {expandedFormGroup === 'Admin' && userIsAdminOrMod(currentUser) && <div className={classes.formGroup}>
          <h3 className={classes.formGroupTitle}>Admin</h3>
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

          {isLWorAF() && (userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'alignmentForumAdmins')) && <div className={classes.fieldWrapper}>
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

          {isEAForum() && <div className={classes.fieldWrapper}>
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

          {isLWorAF() && userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
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
          {(!isEAForum() || userIsAdmin(currentUser)) && <div className={classes.fieldWrapper}>
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

          {(!isEAForum() || userIsAdmin(currentUser)) && <div className={classes.fieldWrapper}>
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
        </div>}

        {expandedFormGroup === 'Event' && userIsAdminOrMod(currentUser) && <div className={classes.formGroup}>
          <h3 className={classes.formGroupTitle}>Event Info</h3>
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
        </div>}

        {expandedFormGroup === 'Options' && <div className={classes.formGroup}>
          <h3 className={classes.formGroupTitle}>Options</h3>
            {!hideCrosspostControl && form.state.values.userId && userCanEditCrosspostSettings(currentUser, { userId: form.state.values.userId }) && <div className={classes.fieldWrapper}>
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

            {hasSidenotes() && <div className={classes.fieldWrapper}>
              <form.Field name="disableSidenotes">
                {(field) => (
                  <FormComponentCheckbox
                    field={field}
                    label="Disable sidenotes"
                  />
                )}
              </form.Field>
            </div>}
        </div>}

        {expandedFormGroup === 'Audio' && (userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'podcasters')) && <div className={classes.formGroup}>
            <h3 className={classes.formGroupTitle}>Audio</h3>
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
          </div>
        }

        {expandedFormGroup === 'Moderation' && <div className={classes.formGroup}>
          <h3 className={classes.formGroupTitle}>Moderation</h3>
          {!isFriendlyUI() && <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
            <form.Field name="moderationGuidelines">
              {(field) => (
                <EditorFormComponent
                  field={field}
                  name="moderationGuidelines"
                  formType={formType}
                  document={form.state.values}
                  addOnSubmitCallback={addOnSubmitCallbackModerationGuidelines}
                  addOnSuccessCallback={addOnSuccessCallbackModerationGuidelines}
                  hintText={getDefaultEditorPlaceholder()}
                  fieldName="moderationGuidelines"
                  collectionName="Posts"
                  commentEditor={true}
                  commentStyles={true}
                  hideControls={false}
                />
              )}
            </form.Field>
          </div>}

          {!isFriendlyUI() && !isDialogue && <div className={classes.fieldWrapper}>
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

          {!isEAForum() && !isDialogue && <div className={classes.fieldWrapper}>
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

          {isEAForum() && (userIsAdmin(currentUser) || postCanEditHideCommentKarma(currentUser, form.state.values)) && <div className={classes.fieldWrapper}>
            <form.Field name="hideCommentKarma">
              {(field) => (
                <FormComponentCheckbox
                  field={field}
                  label="Hide comment karma"
                />
              )}
            </form.Field>
          </div>}
        </div>}

        {/* {expandedFormGroup === 'Glossary' && userCanCreateAndEditJargonTerms(currentUser) && <div className={classes.formGroup}>
            <GlossaryEditFormWrapper
              document={form.state.values}
            />
        </div>} */}
      </div>
    </>
  );
};

export default PostFormSecondaryGroups;

