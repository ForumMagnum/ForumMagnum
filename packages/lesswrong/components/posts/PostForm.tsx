import { EditablePost, PostSubmitMeta, userCanEditCoauthors, detectLinkpost } from "@/lib/collections/posts/helpers";
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { isLWorAF, isEAForum, fmCrosspostSiteNameSetting, fmCrosspostBaseUrlSetting } from "@/lib/instanceSettings";
import { preferredHeadingCase } from "@/themes/forumTheme";
import { useForm } from "@tanstack/react-form";
import classNames from "classnames";
import React, { useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
import ForumIcon from "../common/ForumIcon";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import PostFormSecondaryGroups from "./PostFormSecondaryGroups";
import EditorSettingsSidebar from "./EditorSettingsSidebar";
import MobileEditorBottomBar from "./MobileEditorBottomBar";
import { localGroupTypeFormOptions } from "@/lib/collections/localgroups/groupTypes";
import { EVENT_TYPES } from "@/lib/collections/posts/constants";
import { isClient } from "@/lib/executionEnvironment";
import FormatDate from "../common/FormatDate";
import UsersSearchAutoComplete from "../search/UsersSearchAutoComplete";
import UsersNameWrapper from "../users/UsersNameWrapper";
import ErrorBoundary from "../common/ErrorBoundary";
import { InlineCommentsPanelContext } from "../common/sharedContexts";

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
  topRightControls: {
    position: "fixed",
    top: "var(--editor-right-rail-top)",
    right: 20,
    zIndex: theme.zIndexes.hideTableOfContentsButton + 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    transition: "top 0.2s ease-in-out",
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: theme.palette.greyBorder("1px", 0.16),
    background: theme.palette.panelBackground.default,
    color: theme.palette.greyAlpha(0.75),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
    "&:hover": {
      color: theme.palette.greyAlpha(0.96),
      borderColor: theme.palette.greyAlpha(0.25),
      background: theme.palette.background.pageActiveAreaBackground,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.45,
    },
  },
  iconButtonActive: {
    color: theme.palette.greyAlpha(0.98),
    borderColor: theme.palette.greyAlpha(0.34),
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: `0 0 0 1px ${theme.palette.greyAlpha(0.08)} inset`,
  },
  publishIconButton: {
    background: theme.palette.buttons.alwaysPrimary,
    border: "none",
    color: theme.palette.text.alwaysWhite,
    "&:hover": {
      background: theme.palette.primary.dark,
      color: theme.palette.text.alwaysWhite,
    },
  },
  publishIconButtonActive: {
    background: theme.palette.primary.dark,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
  icon: {
    width: 16,
    height: 16,
  },
  // Metadata row below title — matches LWPostsPageHeader.authorAndSecondaryInfo exactly
  metadataRow: {
    display: "flex",
    alignItems: "baseline",
    columnGap: 20,
    ...theme.typography.commentStyle,
    fontSize: 16,
    flexWrap: "wrap",
    color: theme.palette.text.dim3,
    marginTop: 12,
    marginBottom: 96,
  },
  metaAuthorInfo: {
    color: theme.palette.text.primary,
  },
  metaAuthorName: {
    fontWeight: 600,
  },
  metaCoauthorName: {
    fontWeight: 600,
  },
  metaCoauthorRemove: {
    cursor: "pointer",
    marginLeft: 3,
    opacity: 0.35,
    "&:hover": {
      opacity: 0.7,
    },
  },
  addCoauthorButton: {
    ...theme.typography.commentStyle,
    display: "inline",
    background: "none",
    border: "none",
    padding: "0 2px",
    margin: 0,
    marginLeft: 2,
    cursor: "pointer",
    color: theme.palette.text.dim3,
    opacity: 0.4,
    fontSize: "1.1em",
    lineHeight: 1,
    verticalAlign: "baseline",
    "&:hover": {
      opacity: 0.85,
    },
  },
  metaDate: {
    cursor: "default",
  },
  // Linkpost toggle styled as inline text link, matching metadata row aesthetic
  linkpostToggle: {
    ...theme.typography.commentStyle,
    display: "inline",
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    cursor: "pointer",
    color: theme.palette.text.dim3,
    opacity: 0.5,
    fontSize: "inherit",
    lineHeight: "inherit",
    "&:hover": {
      opacity: 1,
    },
  },
  linkpostToggleActive: {
    opacity: 1,
    color: "inherit",
    "&:hover": {
      opacity: 0.75,
    },
  },
  // Inline linkpost URL input — sits inside the metadata row as a flex item
  linkpostInputWrapper: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 4,
  },
  linkpostInput: {
    ...theme.typography.commentStyle,
    fontSize: "inherit",
    width: 200,
    border: "none",
    borderBottom: theme.palette.greyBorder("1px", 0.3),
    padding: "0 2px 1px",
    color: theme.palette.text.normal,
    background: "transparent",
    outline: "none",
    "&:focus": {
      borderBottomColor: theme.palette.greyAlpha(0.6),
    },
    "&::placeholder": {
      color: theme.palette.text.dim3,
      opacity: 0.6,
    },
  },
  linkpostConfirmButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    marginLeft: 2,
    cursor: "pointer",
    color: theme.palette.text.dim3,
    opacity: 0.5,
    "&:hover": {
      opacity: 1,
    },
  },
  linkpostConfirmIcon: {
    width: 14,
    height: 14,
  },
  // Inline linkpost display (after URL is set) — matches live post page style
  linkpostDisplay: {
    display: "inline",
  },
  linkpostLink: {
    color: "inherit",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  linkpostEditIcon: {
    ...theme.typography.commentStyle,
    display: "inline",
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    marginLeft: 6,
    cursor: "pointer",
    color: theme.palette.text.dim3,
    opacity: 0.35,
    fontSize: 12,
    verticalAlign: "baseline",
    "&:hover": {
      opacity: 0.7,
    },
  },
  coauthorSearchRow: {
    marginTop: -28,
    marginBottom: 24,
    maxWidth: 300,
    ...theme.typography.commentStyle,
    "& .UsersSearchInput-input": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.greyAlpha(0.35),
      },
    },
    "& .MuiInputBase-input": {
      ...theme.typography.commentStyle,
      fontSize: 13,
    },
  },
  // Override EditTitle margins to match LWPostsPageHeader layout:
  // LWPostsPageHeader uses paddingTop: 110 on its wrapper; we replicate
  // by keeping marginTop on EditTitle and zeroing out marginBottom
  // (the metadata row provides spacing below instead).
  titleWithMetadata: {
    "& .EditTitle-root": {
      marginBottom: 0,
    },
  },
  mobileBottomPadding: {
    [theme.breakpoints.down("md")]: {
      paddingBottom: 72,
    },
  },
  '@global': {
    ':root': {
      '--editor-right-rail-top': '20px',
      '--editor-right-rail-height': 'calc(100vh - 28px)',
    },
    'body:has(.headroom--pinned), body:has(.headroom--unfixed)': {
      '--editor-right-rail-top': 'calc(var(--header-height, 56px) + 20px)',
      '--editor-right-rail-height': 'calc(100vh - var(--header-height, 56px) - 28px)',
    },
  },
}));

function getDraftLabel(post: { draft?: boolean | null } | null) {
  if (!post) return "Save Draft";
  if (!post.draft) return "Move to Drafts";
  return "Save Draft";
}

const ON_SUBMIT_META: PostSubmitMeta = {};

const SyncTitleToParent = ({ title, onTitleChange }: {
  title: string;
  onTitleChange: (title: string) => void;
}) => {
  React.useEffect(() => {
    onTitleChange(title);
  }, [title, onTitleChange]);
  return null;
};


const PostForm = ({
  initialData,
  onSuccess,
  onTitleChange,
}: {
  initialData: EditablePost;
  onSuccess: (doc: PostsEditMutationFragment, options?: { submitOptions: PostSubmitMeta }) => void;
  onTitleChange?: (title: string) => void;
}) => {
  const classes = useStyles(formStyles);
  const currentUser = useCurrentUser();
  const [editorType, setEditorType] = useState<string>();
  const [sidebarPanel, setSidebarPanel] = useState<"publish" | "settings" | "sharing" | null>("settings");
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showCoauthorSearch, setShowCoauthorSearch] = useState(false);
  const [editingLinkpostUrl, setEditingLinkpostUrl] = useState(false);
  const [linkpostUrlDraft, setLinkpostUrlDraft] = useState("");

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
        onSubmitCallbackCustomHighlight.current?.(),
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
        onSuccessCallbackCustomHighlight.current?.(result, meta);
        onSuccessCallbackModerationGuidelines.current?.(result, meta);

        meta.successCallback?.(result);

        onSuccess(result, { submitOptions: meta });
        setCaughtError(undefined);
      } catch (error) {
        setCaughtError(error);
      }
    },
  });

  useEffect(() => {
    if (sidebarPanel) {
      setShowComments(false);
    }
  }, [sidebarPanel]);

  const inlineCommentsContext = useMemo(() => ({
    showComments, setShowComments, commentCount, setCommentCount,
  }), [showComments, commentCount]);

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

  const useSidebarLayout = isLWorAF();

  // On non-LW forums, submit buttons are inline below the editor
  const postSubmit = !useSidebarLayout ? (
    <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting, draft: s.values.draft })}>
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
    </form.Subscribe>
  ) : null;

  // On LW, the settings sidebar is portaled into the right column of ToCColumn
  const sidebarPortalTarget = useSidebarLayout && isClient
    ? document.getElementById("editor-settings-portal")
    : null;

  return (
    <InlineCommentsPanelContext.Provider value={inlineCommentsContext}>
    <form className={classNames(useSidebarLayout && classes.mobileBottomPadding)} onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {displayedErrorComponent}

      {useSidebarLayout && <form.Subscribe selector={() => ({})}>
        {() => (
          <div className={classes.topRightControls}>
            <button
              type="button"
              className={classNames(
                classes.iconButton,
                classes.publishIconButton,
                sidebarPanel === "publish" && classes.iconButtonActive,
                sidebarPanel === "publish" && classes.publishIconButtonActive,
              )}
              title={sidebarPanel === "publish" ? "Hide publish panel" : "Open publish panel"}
              onClick={() => setSidebarPanel((panel) => panel === "publish" ? null : "publish")}
            >
              <ForumIcon icon="ArrowRightOutline" className={classes.icon} />
            </button>
            <button
              type="button"
              className={classNames(classes.iconButton, sidebarPanel === "sharing" && classes.iconButtonActive)}
              title={sidebarPanel === "sharing" ? "Hide sharing panel" : "Share & collaborate"}
              onClick={() => setSidebarPanel((panel) => panel === "sharing" ? null : "sharing")}
            >
              <ForumIcon icon="GroupAdd" className={classes.icon} />
            </button>
            <button
              type="button"
              className={classNames(classes.iconButton, sidebarPanel === "settings" && classes.iconButtonActive)}
              title={sidebarPanel === "settings" ? "Hide settings" : "Show settings"}
              onClick={() => setSidebarPanel((panel) => panel === "settings" ? null : "settings")}
            >
              <ForumIcon icon="Settings" className={classes.icon} />
            </button>
            {(commentCount > 0 || showComments) && <button
              type="button"
              className={classNames(classes.iconButton, showComments && classes.iconButtonActive)}
              title={showComments ? "Hide comments" : "Show comments"}
              onClick={() => {
                setSidebarPanel(null);
                setShowComments((v) => !v);
              }}
            >
              <ForumIcon icon="Comment" className={classes.icon} />
            </button>}
          </div>
        )}
      </form.Subscribe>}

      {/* On LW, the top bar contents (post category, sharing) move to the sidebar */}
      {!useSidebarLayout && <FormGroupPostTopBar>
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
      </FormGroupPostTopBar>}

      <LegacyFormGroupLayout
        groupStyling={false}
        paddingStyling={!useSidebarLayout}
        flexAlignTopStyling={true}
      >
        {onTitleChange && <form.Subscribe selector={(s) => s.values.title ?? ""}>
          {(title) => <SyncTitleToParent title={title} onTitleChange={onTitleChange} />}
        </form.Subscribe>}
        <div className={classNames('form-component-EditTitle', useSidebarLayout && classes.titleWithMetadata)}>
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

      {useSidebarLayout && !(isEvent || isDialogue) && (
        <LegacyFormGroupLayout groupStyling={false} paddingStyling={false}>
          <div className={classes.metadataRow}>
            <span className={classes.metaAuthorInfo}>
              by{" "}
              <span className={classes.metaAuthorName}>{currentUser?.displayName}</span>
              <form.Field name="coauthorUserIds">
                {(field) => <>
                  {(field.state.value ?? []).map((userId) => (
                    <span key={userId}>
                      , <UsersNameWrapper documentId={userId} simple className={classes.metaCoauthorName} />
                      <span className={classes.metaCoauthorRemove} onClick={() => {
                        field.handleChange((field.state.value ?? []).filter((uid) => uid !== userId));
                      }}>&times;</span>
                    </span>
                  ))}
                  {userCanEditCoauthors(currentUser) && (
                    <button
                      type="button"
                      className={classes.addCoauthorButton}
                      title="Add co-author"
                      onClick={() => setShowCoauthorSearch((v) => !v)}
                    >
                      {" +"}
                    </button>
                  )}
                </>}
              </form.Field>
            </span>

            <span className={classes.metaDate}>
              {initialData.draft === false && initialData.postedAt
                ? <FormatDate date={initialData.postedAt} format="Do MMM YYYY" />
                : "Draft"
              }
            </span>

            <form.Subscribe selector={(s) => ({ postCategory: s.values.postCategory, url: s.values.url })}>
              {({ postCategory, url }) => {
                const isLinkpost = postCategory === "linkpost";
                const { linkpostDomain } = detectLinkpost({ url });

                if (isLinkpost && url && linkpostDomain && !editingLinkpostUrl) {
                  // Show "Linkpost for domain.com" with edit icon
                  return (
                    <span className={classes.linkpostDisplay}>
                      <LWTooltip title={<div>View the original at:<br/>{url}</div>}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className={classes.linkpostLink}>
                          Linkpost for {linkpostDomain}
                        </a>
                      </LWTooltip>
                      <button
                        type="button"
                        className={classes.linkpostEditIcon}
                        title="Edit linkpost URL"
                        onClick={() => {
                          setLinkpostUrlDraft(url || "");
                          setEditingLinkpostUrl(true);
                        }}
                      >
                        <ForumIcon icon="Edit" className={classes.icon} />
                      </button>
                    </span>
                  );
                }

                if (isLinkpost && editingLinkpostUrl) {
                  // Show "Linkpost for" label + inline input
                  return (
                    <span className={classes.linkpostInputWrapper}>
                      <button
                        type="button"
                        className={classNames(classes.linkpostToggle, classes.linkpostToggleActive)}
                        title="Remove linkpost"
                        onClick={() => {
                          form.setFieldValue("postCategory", "post");
                          form.setFieldValue("url", "");
                          setEditingLinkpostUrl(false);
                        }}
                      >
                        Linkpost for
                      </button>
                      <input
                        type="url"
                        className={classes.linkpostInput}
                        placeholder="url"
                        value={linkpostUrlDraft}
                        onChange={(e) => setLinkpostUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (linkpostUrlDraft.trim()) {
                              form.setFieldValue("url", linkpostUrlDraft.trim());
                              setEditingLinkpostUrl(false);
                            }
                          } else if (e.key === "Escape") {
                            if (url) {
                              setEditingLinkpostUrl(false);
                            } else {
                              form.setFieldValue("postCategory", "post");
                              setEditingLinkpostUrl(false);
                            }
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className={classes.linkpostConfirmButton}
                        title="Confirm URL"
                        onClick={() => {
                          if (linkpostUrlDraft.trim()) {
                            form.setFieldValue("url", linkpostUrlDraft.trim());
                            setEditingLinkpostUrl(false);
                          }
                        }}
                      >
                        <ForumIcon icon="Check" className={classes.linkpostConfirmIcon} />
                      </button>
                      <button
                        type="button"
                        className={classes.linkpostConfirmButton}
                        title="Remove linkpost"
                        onClick={() => {
                          form.setFieldValue("postCategory", "post");
                          form.setFieldValue("url", "");
                          setEditingLinkpostUrl(false);
                        }}
                      >
                        <ForumIcon icon="Close" className={classes.linkpostConfirmIcon} />
                      </button>
                    </span>
                  );
                }

                // Show toggle button (no URL set, not editing)
                return (
                  <button
                    type="button"
                    className={classNames(
                      classes.linkpostToggle,
                      isLinkpost && classes.linkpostToggleActive,
                    )}
                    title={isLinkpost ? "Remove linkpost" : "Make this a linkpost"}
                    onClick={() => {
                      if (isLinkpost) {
                        form.setFieldValue("postCategory", "post");
                        form.setFieldValue("url", "");
                        setEditingLinkpostUrl(false);
                      } else {
                        form.setFieldValue("postCategory", "linkpost");
                        setLinkpostUrlDraft("");
                        setEditingLinkpostUrl(true);
                      }
                    }}
                  >
                    {isLinkpost ? "Linkpost" : "+ Linkpost"}
                  </button>
                );
              }}
            </form.Subscribe>
          </div>

          {showCoauthorSearch && (
            <div className={classes.coauthorSearchRow}>
              <ErrorBoundary>
                <form.Field name="coauthorUserIds">
                  {(field) => (
                    <UsersSearchAutoComplete
                      clickAction={(userId) => {
                        const current = field.state.value ?? [];
                        if (!current.includes(userId)) {
                          field.handleChange([...current, userId]);
                        }
                      }}
                      label="Search for co-authors"
                    />
                  )}
                </form.Field>
              </ErrorBoundary>
            </div>
          )}

        </LegacyFormGroupLayout>
      )}

      {/* On non-LW forums, keep the old linkpost URL editing experience */}
      {!useSidebarLayout && <form.Subscribe selector={(s) => ({ isLinkpost: s.values.postCategory === 'linkpost' })}>
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
      </form.Subscribe>}

      <LegacyFormGroupLayout
        groupStyling={false}
        paddingStyling={!useSidebarLayout}
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
                hideControls={useSidebarLayout}
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

      {/* On non-LW forums, settings are inline below the editor */}
      {!useSidebarLayout && <PostFormSecondaryGroups
        form={form}
        initialData={initialData}
        formType={formType}
        currentUser={currentUser}
        addOnSubmitCallbackCustom={addOnSubmitCallbackCustomHighlight}
        addOnSuccessCallbackCustom={addOnSuccessCallbackCustomHighlight}
        addOnSubmitCallbackModerationGuidelines={addOnSubmitCallbackModerationGuidelines}
        addOnSuccessCallbackModerationGuidelines={addOnSuccessCallbackModerationGuidelines}
      />}

      {postSubmit}

      {/* On LW, the settings sidebar is portaled into the right column of ToCColumn */}
      {sidebarPortalTarget && sidebarPanel && createPortal(
        <EditorSettingsSidebar
          form={form}
          initialData={initialData}
          formType={formType}
          mode={sidebarPanel}
          currentUser={currentUser}
          addOnSubmitCallbackCustom={addOnSubmitCallbackCustomHighlight}
          addOnSuccessCallbackCustom={addOnSuccessCallbackCustomHighlight}
          addOnSubmitCallbackModerationGuidelines={addOnSubmitCallbackModerationGuidelines}
          addOnSuccessCallbackModerationGuidelines={addOnSuccessCallbackModerationGuidelines}
        />,
        sidebarPortalTarget
      )}

      {/* On mobile (below md), show bottom bar with Save/Publish + bottom sheet for settings */}
      {useSidebarLayout && (
        <MobileEditorBottomBar
          form={form}
          initialData={initialData}
          formType={formType}
          currentUser={currentUser}
          sidebarPanel={sidebarPanel}
          setSidebarPanel={setSidebarPanel}
          addOnSubmitCallbackCustom={addOnSubmitCallbackCustomHighlight}
          addOnSuccessCallbackCustom={addOnSuccessCallbackCustomHighlight}
          addOnSubmitCallbackModerationGuidelines={addOnSubmitCallbackModerationGuidelines}
          addOnSuccessCallbackModerationGuidelines={addOnSuccessCallbackModerationGuidelines}
        />
      )}
    </form >
    </InlineCommentsPanelContext.Provider>
  );
};

export default PostForm;
