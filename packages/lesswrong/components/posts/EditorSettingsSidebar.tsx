import React, { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { EditablePost, PostSubmitMeta, userCanEditCoauthors, extractGoogleDocId, googleDocIdToUrl, postGetEditUrl } from "@/lib/collections/posts/helpers";
import { postStatusLabels, MODERATION_GUIDELINES_OPTIONS } from "@/lib/collections/posts/constants";
import { getDefaultEditorPlaceholder } from "@/lib/editor/defaultEditorPlaceholder";
import { hasGoogleDocImportSetting, isEAForum, isLWorAF } from "@/lib/instanceSettings";
import { getVotingSystems } from "@/lib/voting/getVotingSystem";
import { userIsAdmin, userIsAdminOrMod, userIsMemberOf } from "@/lib/vulcan-users/permissions";
import { userCanUseSharing } from "@/lib/betas";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import type { EditorTypeString } from "../editor/Editor";
import { disconnectCollaborationForPost } from "../lexical/collaboration";
import ClickAwayListener from "../../lib/vendor/react-click-away-listener";
import { defaultSharingSettings, type SharingSettings, type CollaborativeEditingAccessLevel } from "@/lib/collections/posts/collabEditingPermissions";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { TypedReactFormApi, TypedFieldApi } from "../tanstack-form-components/BaseAppForm";
import { AddOnSubmitCallback, AddOnSuccessCallback, EditorFormComponent } from "../editor/EditorFormComponent";
import { CoauthorsListEditor } from "../form-components/CoauthorsListEditor";
import { SocialPreviewUpload } from "../form-components/SocialPreviewUpload";
import { FormComponentDatePicker } from "../form-components/FormComponentDateTime";
import { FormComponentSelect } from "../form-components/FormComponentSelect";
import { MuiTextField } from "../form-components/MuiTextField";
import { PodcastEpisodeInput } from "../form-components/PodcastEpisodeInput";
import { EditableUsersList } from "../editor/EditableUsersList";
import { MenuItem } from "../common/Menus";
import Select from "@/lib/vendor/@material-ui/core/src/Select";
import { CopyToClipboard } from "react-copy-to-clipboard";
import FooterTagList from "../tagging/FooterTagList";
import LWTooltip from "../common/LWTooltip";
import { PostSubmit } from "./PostSubmit";
import { SubmitToFrontpageCheckbox } from "./SubmitToFrontpageCheckbox";
import { DialogueSubmit } from "./dialogues/DialogueSubmit";
import { Link } from "../../lib/reactRouterWrapper";
import ForumIcon from "../common/ForumIcon";
import { useDialog } from "../common/withDialog";
import { useMessages } from "../common/withMessages";
import { userCanCommentLock, userUseMarkdownPostEditor } from "@/lib/collections/users/helpers";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { useTracking } from "@/lib/analyticsEvents";
import Loading from "../vulcan-core/Loading";
import { gql } from "@/lib/generated/gql-codegen";
import { PostVersionHistoryDialog } from "../editor/PostVersionHistory";

const styles = defineStyles("EditorSettingsSidebar", (theme: ThemeType) => ({
  root: {
    zIndex: 1,
    width: 300,
    position: "fixed",
    top: "var(--editor-right-rail-top)",
    right: 86,
    maxHeight: "var(--editor-right-rail-height)",
    height: "max-content",
    overflowY: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      width: 0,
    },
    paddingLeft: 6,
    paddingRight: 2,
    transition: "top 0.2s ease-in-out, height 0.2s ease-in-out",
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  submitArea: {
    marginBottom: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    "& .PostSubmit-submitButtons": {
      marginLeft: 0,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
    },
    "& .PostSubmit-formButton": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      fontWeight: 500,
      marginLeft: "0 !important",
      width: "100%",
      justifyContent: "center",
      borderRadius: 6,
      padding: "7px 12px",
      textTransform: "none",
      boxShadow: "none",
      letterSpacing: 0,
    },
    "& .PostSubmit-submitButton": {
      background: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite,
      "&:hover": {
        background: theme.palette.primary.dark,
        boxShadow: "none",
      },
    },
    "& .PostSubmit-secondaryButton": {
      color: theme.palette.greyAlpha(0.68),
      background: "transparent",
      border: theme.palette.greyBorder("1px", 0.14),
      "&:hover": {
        background: theme.palette.greyAlpha(0.04),
      },
    },
    "& .PostSubmit-feedback": {
      order: 1,
    },
    "& .SubmitToFrontpageCheckbox-checkboxLabel": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      color: theme.palette.greyAlpha(0.68),
    },
    "& .MuiCheckbox-root": {
      padding: 4,
    },
    "& .MuiCheckbox-root .MuiSvgIcon-root": {
      fontSize: 18,
    },
  },
  actionHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 2,
  },
  actionTitle: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: theme.palette.greyAlpha(0.58),
  },
  actionSubtitle: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.72),
  },
  submitButtons: {
    width: "100%",
  },
  frontpageCheckbox: {
    marginTop: 6,
    paddingTop: 8,
    borderTop: theme.palette.greyBorder("1px", 0.1),
  },
  accordionSection: {
    borderBottom: theme.palette.greyBorder("1px", 0.08),
  },
  panel: {
    border: theme.palette.greyBorder("1px", 0.08),
    borderRadius: 12,
    padding: "0 12px",
    background: theme.palette.background.pageActiveAreaBackground,
    "& > $accordionSection:last-child": {
      borderBottom: "none",
    },
    // Base font for all panel content
    ...theme.typography.commentStyle,
    fontSize: 13,
    "& p": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      margin: "4px 0",
    },
    // ── Global sidebar form-element overrides ──
    // Text fields
    "& .MuiTextField-textField": {
      width: "100%",
    },
    "& .MuiInputBase-input": {
      ...theme.typography.commentStyle,
      fontSize: 13,
    },
    "& .MuiInput-underline:before": {
      borderBottomColor: theme.palette.greyAlpha(0.15),
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: theme.palette.primary.main,
    },
    "& .MuiInputLabel-root": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      color: theme.palette.greyAlpha(0.5),
    },
    // Select dropdowns
    "& .MuiSelect-select": {
      ...theme.typography.commentStyle,
      fontSize: 13,
    },
    // ClearInput (the × button next to selects / date pickers)
    "& .ClearInput-formComponentClear": {
      display: "inline-flex",
      alignItems: "center",
      "& span": {
        position: "static",
        top: "auto",
        padding: "2px 6px",
        ...theme.typography.commentStyle,
        fontSize: 11,
        color: theme.palette.greyAlpha(0.3),
        cursor: "pointer",
        "&:hover": {
          color: theme.palette.greyAlpha(0.65),
        },
      },
    },
    // Date picker labels
    "& .DatePicker-label": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      color: theme.palette.greyAlpha(0.5),
    },
    "& .DatePicker-input": {
      ...theme.typography.commentStyle,
      fontSize: 13,
    },
    "& .DatePicker-timezone": {
      ...theme.typography.commentStyle,
      fontSize: 11,
      color: theme.palette.greyAlpha(0.4),
    },
    // Editor component (moderation guidelines, custom highlight)
    "& .form-component-EditorFormComponent": {
      "& .ck.ck-editor__main > .ck-editor__editable": {
        minHeight: 60,
        maxHeight: 200,
      },
      "& .LexicalContentEditable-root": {
        maxHeight: 200,
        overflowY: "auto",
      },
      "& .LexicalContentEditable-rootComment": {
        "--lexical-comment-min-height": "50px",
      },
    },
    // User search inputs (coauthors, sharing)
    "& .UsersSearchInput-input": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.greyAlpha(0.35),
      },
    },
    // User chips
    "& .SingleUsersItem-chip": {
      height: 24,
      ...theme.typography.commentStyle,
      fontSize: 12,
    },
    // Sortable user lists
    "& .CoauthorsListEditor-root, & .EditableUsersList-listEditor": {
      flexDirection: "column",
      gap: 4,
    },
    "& .CoauthorsListEditor-list, & .EditableUsersList-list": {
      gap: 4,
    },
  },
  accordionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 0",
    cursor: "pointer",
    userSelect: "none",
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.02em",
    color: theme.palette.greyAlpha(0.6),
    transition: "color 0.15s ease",
    "&:hover": {
      color: theme.palette.greyAlpha(0.87),
    },
  },
  accordionIcon: {
    fontSize: 14,
    color: theme.palette.greyAlpha(0.35),
    transition: "transform 0.2s ease, color 0.15s ease",
  },
  accordionIconOpen: {
    transform: "rotate(90deg)",
    color: theme.palette.greyAlpha(0.6),
  },
  accordionContent: {
    paddingBottom: 14,
  },
  sectionActionButton: {
    width: "100%",
    border: "none",
    background: "none",
    textAlign: "left",
    fontFamily: "inherit",
  },
  tagSection: {
    minHeight: 106,
  },
  fieldWrapper: {
    marginTop: 6,
    marginBottom: 6,
  },
  // Toggle switch styles
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 0",
    cursor: "pointer",
    userSelect: "none",
    "&:hover": {
      "& $toggleLabel": {
        color: theme.palette.greyAlpha(0.87),
      },
    },
  },
  toggleLabel: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.68),
    lineHeight: "1.3",
    flex: 1,
    paddingRight: 12,
  },
  toggle: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.palette.greyAlpha(0.18),
    position: "relative",
    transition: "background-color 0.2s ease",
    flexShrink: 0,
  },
  toggleOn: {
    backgroundColor: theme.palette.primary.main,
  },
  toggleHandle: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    backgroundColor: theme.palette.text.alwaysWhite,
    position: "absolute",
    top: 2,
    left: 2,
    transition: "left 0.2s ease",
  },
  toggleHandleOn: {
    left: 16,
  },
  // Sharing panel styles
  sharingPanel: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder("1px", 0.14),
    borderRadius: 12,
    padding: "14px 12px 12px",
    marginBottom: 14,
    // User list layout
    "& .CoauthorsListEditor-root, & .EditableUsersList-listEditor": {
      flexDirection: "column",
    },
    // User search inputs
    "& .UsersSearchInput-input": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.greyAlpha(0.35),
      },
      padding: 0,
    },
    "& .MuiInputBase-input": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      padding: 0,
    },
    "& .UsersSearchInput-input.MuiInput-underline:before": {
      borderBottom: "none !important",
    },
    "& .MuiInput-underline:after": {
      transform: "scaleX(0)",
    },
    // User chips
    "& .SingleUsersItem-chip": {
      height: 24,
      ...theme.typography.commentStyle,
      fontSize: 12,
    },
  },
  sharingSection: {},
  sharingSectionFlex: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
  },
  sharingDivider: {
    height: 1,
    background: theme.palette.greyAlpha(0.1),
    margin: "14px 0",
  },
  sectionLabel: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.greyAlpha(0.5),
    marginBottom: 8,
  },
  shareLinkButtonContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  shareLinkButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "50%",
    padding: "8px 12px",
    marginTop: 16,
    marginBottom: 14,
    borderRadius: 8,
    border: "none",
    background: theme.palette.primary.main,
    cursor: "pointer",
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.alwaysWhite,
    transition: "all 0.15s ease",
    "&:hover": {
      background: theme.palette.primary.dark,
    },
  },
  openInClaudeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "50%",
    padding: "8px 12px",
    marginTop: 16,
    marginBottom: 14,
    borderRadius: 8,
    border: "none",
    background: theme.palette.buttons.shareWithClaude,
    cursor: "pointer",
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.alwaysWhite,
    textDecoration: "none",
    transition: "all 0.15s ease",
    "&:hover": {
      background: theme.palette.buttons.shareWithClaudeHover,
      // By default, links get opacity 0.5 in our codebase, but we want this to feel more like a button
      opacity: 'initial',
    },
  },
  openInClaudeButtonTooltip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
  },
  shareLinkIcon: {
    fontSize: 15,
  },
  copyLinkIcon: {
    fontSize: 14,
  },
  linkSharingStatus: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.5),
    marginTop: 8,
  },
  linkSharingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  linkSharingDotOn: {
    background: theme.palette.lwTertiary.main,
  },
  linkSharingDotOff: {
    background: theme.palette.greyAlpha(0.25),
  },
  textButton: {
    ...theme.typography.commentStyle,
    display: "inline",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontSize: 12,
    color: theme.palette.greyAlpha(0.45),
    "&:hover": {
      color: theme.palette.greyAlpha(0.7),
    },
  },
  permissionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  permissionLabel: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.68),
  },
  permissionSelect: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    minWidth: 90,
    "& .MuiSelect-select": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      padding: "2px 24px 2px 6px",
    },
    "& .MuiSelect-icon": {
      fontSize: 18,
      color: theme.palette.greyAlpha(0.4),
    },
    "& .MuiInput-underline:before": {
      borderBottomColor: theme.palette.greyAlpha(0.12),
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: theme.palette.primary.main,
    },
  },
  disabledMessage: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.45),
    fontStyle: "italic",
    textAlign: "center",
    padding: "6px 0",
  },
  sectionText: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.68),
  },
  // Moderation section
  moderationStyleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  moderationStyleLabel: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.68),
    flexShrink: 0,
  },
  moderationStyleSelect: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    flex: 1,
    minWidth: 0,
    "& .MuiSelect-select": {
      ...theme.typography.commentStyle,
      fontSize: 12,
      padding: "4px 24px 4px 6px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .MuiSelect-icon": {
      fontSize: 18,
      color: theme.palette.greyAlpha(0.4),
    },
    "& .MuiInput-underline:before": {
      borderBottomColor: theme.palette.greyAlpha(0.12),
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: theme.palette.primary.main,
    },
  },
  moderationGuidelinesLabel: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.68),
    marginBottom: 4,
  },
  socialPreviewCard: {
    marginBottom: 10,
    // Card title text
    "& .SocialPreviewUpload-cardTitle": {
      ...theme.typography.commentStyle,
      fontSize: 13,
      fontWeight: 700,
    },
    // Description editor
    "& .SocialPreviewUpload-descriptionWrapper": {
      minHeight: 40,
    },
    "& .SocialPreviewUpload-description": {
      ...theme.typography.commentStyle,
      fontSize: 12,
      maxHeight: 56,
    },
    // Revert button
    "& .SocialPreviewUpload-revertButton": {
      ...theme.typography.commentStyle,
      fontSize: 11,
    },
    // Image upload button
    "& .ImageUpload2-button": {
      ...theme.typography.commentStyle,
      fontSize: 12,
      padding: "4px 10px",
      margin: "2px 0",
    },
  },
  socialPreviewCardTitle: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: theme.palette.greyAlpha(0.58),
    marginBottom: 10,
  },
  editorGuideLink: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "14px 2px",
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.45),
    transition: "color 0.15s ease",
    "&:hover": {
      color: theme.palette.greyAlpha(0.75),
    },
  },
  editorGuideIcon: {
    fontSize: 16,
  },
  importInfo: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.6),
    lineHeight: "1.4",
    marginBottom: 8,
  },
  importInput: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    width: "100%",
    backgroundColor: theme.palette.greyAlpha(0.04),
    borderRadius: 6,
    padding: "8px 8px",
    color: theme.palette.text.normal,
    outline: "none",
    "&::placeholder": {
      color: theme.palette.greyAlpha(0.35),
    },
  },
  importButton: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 600,
    width: "100%",
    padding: "7px 12px",
    borderRadius: 6,
    border: "none",
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    transition: "background 0.15s ease",
    "&:hover": {
      background: theme.palette.primary.dark,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  importError: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.error.main,
    marginTop: 4,
  },
  importFooter: {
    ...theme.typography.commentStyle,
    fontSize: 11,
    color: theme.palette.greyAlpha(0.45),
    fontStyle: "italic",
    marginTop: 6,
  },
  importLoadingDots: {
    marginTop: -8,
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

const STICKY_PRIORITIES: Record<number, string> = {
  1: "Low",
  2: "Normal",
  3: "Elevated",
  4: "Max",
};

function getFeedbackQuery(postId: string, linkSharingKey: string | undefined) {
  const postUrl = postGetEditUrl(postId, true, linkSharingKey);
  return `I'm writing a post on LessWrong and would appreciate your inline feedback on it.  The post is located at ${postUrl}.

Please remember to follow the guidelines in LessWrong's SKILL.md (https://www.lesswrong.com/SKILL.md).`;
}

function AccordionSection({ title, defaultOpen = false, children, className, contentClassName }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const classes = useStyles(styles);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={classNames(classes.accordionSection, className)}>
      <div className={classes.accordionHeader} onClick={() => setOpen(!open)}>
        {title}
        <ForumIcon
          icon="ChevronRight"
          className={classNames(classes.accordionIcon, { [classes.accordionIconOpen]: open })}
        />
      </div>
      {open && <div className={classNames(classes.accordionContent, contentClassName)}>{children}</div>}
    </div>
  );
}

function SidebarToggle({ field, label }: {
  field: TypedFieldApi<boolean | null | undefined>;
  label: string;
}) {
  const classes = useStyles(styles);
  return (
    <div className={classes.toggleRow} onClick={() => field.handleChange(!field.state.value)}>
      <span className={classes.toggleLabel}>{label}</span>
      <div className={classNames(classes.toggle, { [classes.toggleOn]: !!field.state.value })}>
        <div className={classNames(classes.toggleHandle, { [classes.toggleHandleOn]: !!field.state.value })} />
      </div>
    </div>
  );
}

function SharingPermissionSelect({ field, settingsKey, label }: {
  field: TypedFieldApi<SharingSettings | null | undefined>;
  settingsKey: keyof SharingSettings;
  label?: string;
}) {
  const classes = useStyles(styles);
  const settings = field.state.value ?? defaultSharingSettings;
  return (
    <div className={classes.permissionRow}>
      {label && <div className={classes.permissionLabel}>{label}</div>}
      <Select
        className={classes.permissionSelect}
        value={settings[settingsKey]}
        onChange={(e) => field.handleChange({
          ...settings,
          [settingsKey]: e.target.value as CollaborativeEditingAccessLevel,
        })}
      >
        <MenuItem value="none">None</MenuItem>
        <MenuItem value="read">Read</MenuItem>
        <MenuItem value="comment">Comment</MenuItem>
        <MenuItem value="edit">Edit</MenuItem>
      </Select>
    </div>
  );
}

function SharingPanel({ form, canShare, canEditCoauthors, flash }: {
  form: TypedReactFormApi<EditablePost & { title: string }, PostSubmitMeta>;
  canShare: boolean;
  canEditCoauthors: boolean;
  flash: (message: string) => void;
}) {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();

  const postId = form.state.values._id;
  const linkSharingKey = form.state.values.linkSharingKey ?? undefined;

  return (
    <div className={classes.sharingPanel}>
      <div className={classes.actionHeader}>
        <div className={classes.actionTitle}>Sharing</div>
      </div>

      {canShare ? <>
        {/* Share link section */}
        <div className={classes.sharingSection}>
          <form.Field name="sharingSettings">
            {(field) => {
              const settings = field.state.value ?? defaultSharingSettings;
              const linkEnabled = settings.anyoneWithLinkCan !== "none";

              if (!postId) {
                return <div className={classes.disabledMessage}>
                  Save this post first to share a link
                </div>;
              }

              const claudeUrl = `https://www.claude.ai/new?q=${encodeURIComponent(getFeedbackQuery(postId, linkSharingKey))}`;
              const shareWithClaudeButton = (
                <a
                  href={claudeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.openInClaudeButton}
                  onClick={() => {
                    captureEvent("shareWithClaudeClicked", { postId });
                    field.handleChange({
                      ...settings,
                      ...(settings.anyoneWithLinkCan === 'none' ? { anyoneWithLinkCan: "edit" } : {}),
                    });
                  }}
                >
                <LWTooltip
                  className={classes.openInClaudeButtonTooltip}
                  title="Opens a new conversation in claude.ai with our default feedback prompt.  If you change it, you need to explicitly tell Claude to leave feedback in the editor, or it will respond to you in chat.  (We can't do this for you since it's treated as a prompt injection.)"
                >
                  <ForumIcon icon="OpenInNew" className={classes.shareLinkIcon} />
                  Claude
                </LWTooltip>
                </a>
              );

              const shareLinkButton = (
                <button
                  type="button"
                  className={classes.shareLinkButton}
                  onClick={() => {
                    field.handleChange({
                      ...settings,
                      anyoneWithLinkCan: "edit",
                    });
                    // Copy link after enabling
                    const url = postGetEditUrl(postId, true, linkSharingKey);
                    void navigator.clipboard.writeText(url)
                      .then(() => flash("Link sharing enabled & link copied"))
                      .catch(() => flash("Failed to copy link"));
                  }}
                >
                  <ForumIcon icon="Link" className={classes.shareLinkIcon} />
                  Share link
                </button>
              );

              if (!linkEnabled) {
                return <div className={classes.shareLinkButtonContainer}>{shareLinkButton}{shareWithClaudeButton}</div>;
              }

              const copyLinkButton = (
                <CopyToClipboard
                  text={postGetEditUrl(postId, true, linkSharingKey)}
                  onCopy={() => flash("Link copied")}
                >
                  <button type="button" className={classes.shareLinkButton}>
                    <ForumIcon icon="Link" className={classes.copyLinkIcon} />
                    Copy link
                  </button>
                </CopyToClipboard>
              );

              return <div className={classes.shareLinkButtonContainer}>{copyLinkButton}{shareWithClaudeButton}</div>;
            }}
          </form.Field>

          <form.Field name="sharingSettings">
            {(field) => (
              <SharingPermissionSelect field={field} settingsKey="anyoneWithLinkCan" label="Anyone with link can" />
            )}
          </form.Field>
        </div>

        {/* Shared users section */}
        <div className={classes.sharingSectionFlex}>
          <form.Field name="shareWithUsers">
            {(field) => (
              <EditableUsersList
                value={field.state.value ?? []}
                setValue={(newUsers) => field.handleChange(newUsers)}
                label="Add people by name"
              />
            )}
          </form.Field>

          <form.Field name="sharingSettings">
            {(field) => (
              <SharingPermissionSelect field={field} settingsKey="explicitlySharedUsersCan" />
            )}
          </form.Field>
        </div>

        {/* Co-Authors */}
        {canEditCoauthors && <>
          <div className={classes.sharingDivider} />
          <div className={classes.sharingSection}>
            <form.Field name="coauthorUserIds">
              {(field) => (
                <CoauthorsListEditor
                  field={field}
                  post={form.state.values}
                  label="Add co-author"
                />
              )}
            </form.Field>
          </div>
        </>}
      </> : (
        <div className={classes.disabledMessage}>
          You need at least 1 karma to use sharing features
        </div>
      )}
    </div>
  );
}

const latestGoogleDocMetadataSidebarQuery = gql(`
  query latestGoogleDocMetadataSidebar($postId: String!) {
    latestGoogleDocMetadata(postId: $postId)
  }
`);

const importGoogleDocSidebarMutation = gql(`
  mutation ImportGoogleDocSidebar($fileUrl: String!, $postId: String) {
    ImportGoogleDoc(fileUrl: $fileUrl, postId: $postId) {
      ...PostsBase
    }
  }
`);

function GoogleDocImportSection({ postId }: { postId: string }) {
  const classes = useStyles(styles);
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { captureEvent } = useTracking();
  const { flash } = useMessages();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: metadataData } = useQuery(
    latestGoogleDocMetadataSidebarQuery,
    {
      variables: { postId },
      context: { batchKey: "docImportInfo" },
    }
  );
  const previousDocId = metadataData?.latestGoogleDocMetadata?.id;

  useEffect(() => {
    if (previousDocId) {
      setGoogleDocUrl(googleDocIdToUrl(previousDocId));
    }
  }, [previousDocId]);

  const fileId = extractGoogleDocId(googleDocUrl);
  const canImport = !!fileId;

  const [importGoogleDocMutation, { loading: mutationLoading }] = useMutation(
    importGoogleDocSidebarMutation,
    {
      onCompleted: (data) => {
        setErrorMessage(null);
        const result = data?.ImportGoogleDoc;
        if (!result) return;

        const editPostUrl = postGetEditUrl(result._id, false, result.linkSharingKey ?? undefined);

        captureEvent("googleDocImportSubmitted", {
          success: true,
          fileUrl: googleDocUrl,
          postId: result._id,
        });

        if (location.url === editPostUrl) {
          window.location.reload();
        } else {
          void navigate(editPostUrl);
        }
      },
      onError: (error) => {
        captureEvent("googleDocImportSubmitted", {
          success: false,
          fileUrl: googleDocUrl,
          postId,
        });
        setErrorMessage(error.message);
        flash(error.message);
      },
    }
  );

  const handleImportClick = useCallback(async () => {
    // Clear any live/local Yjs state before the import replaces the server copy.
    await disconnectCollaborationForPost(postId);
    void importGoogleDocMutation({
      variables: { fileUrl: googleDocUrl, postId },
    });
  }, [googleDocUrl, importGoogleDocMutation, postId]);

  return (
    <AccordionSection title="Import Google Doc">
      <div className={classes.importInfo}>
        Paste a link to a publicly accessible Google Doc (sharing set to "Anyone with the link can view")
      </div>
      <input
        className={classes.importInput}
        type="url"
        placeholder="https://docs.google.com/document/d/..."
        value={googleDocUrl}
        onChange={(e) => setGoogleDocUrl(e.target.value)}
      />
      {errorMessage && <div className={classes.importError}>{errorMessage}</div>}
      <button
        type="button"
        className={classes.importButton}
        disabled={!canImport || mutationLoading}
        onClick={handleImportClick}
      >
        {mutationLoading ? <Loading className={classes.importLoadingDots} /> : "Import"}
      </button>
      <div className={classes.importFooter}>
        This will overwrite any unsaved changes, but you can still restore saved versions from "Version history"
      </div>
    </AccordionSection>
  );
}

const convertDocumentEditorTypeMutation = gql(`
  mutation ConvertDocumentEditorType($documentId: String!, $collectionName: ConvertibleCollectionName!, $fieldName: String!, $document: JSON!, $targetFormat: String!) {
    convertDocumentEditorType(documentId: $documentId, collectionName: $collectionName, fieldName: $fieldName, document: $document, targetFormat: $targetFormat)
  }
`);

function MarkdownEditorToggle({ form }: {
  form: TypedReactFormApi<EditablePost & { title: string }, PostSubmitMeta>;
}) {
  const classes = useStyles(styles);
  const contents = form.state.values.contents;
  const currentType = contents?.originalContents?.type;
  const isMarkdown = currentType === "markdown";
  const postId = form.state.values._id;

  const [convertEditorType, { loading }] = useMutation(convertDocumentEditorTypeMutation, {
    onCompleted: () => {
      // Reload to remount the editor with the new revision
      window.location.reload();
    },
  });

  const handleToggle = useCallback(async () => {
    if (loading || !postId || !contents?.originalContents) return;
    const targetFormat: EditorTypeString = isMarkdown ? "lexical" : "markdown";

    // Disconnect local Hocuspocus providers before converting, same as
    // PostVersionHistory does before restoring a revision. Prevents stale
    // local Yjs state from being re-synced after the server resets the document.
    await disconnectCollaborationForPost(postId);

    void convertEditorType({
      variables: {
        documentId: postId,
        collectionName: "Posts",
        fieldName: "contents",
        document: {
          type: contents.originalContents.type,
          value: contents.originalContents.data,
        },
        targetFormat,
      },
    });
  }, [loading, postId, contents, isMarkdown, convertEditorType]);

  return (
    <div className={classes.toggleRow} onClick={handleToggle}>
      <span className={classes.toggleLabel}>
        {loading ? "Converting…" : "Markdown editor"}
      </span>
      <div className={classNames(classes.toggle, { [classes.toggleOn]: isMarkdown })}>
        <div className={classNames(classes.toggleHandle, { [classes.toggleHandleOn]: isMarkdown })} />
      </div>
    </div>
  );
}

interface EditorSettingsSidebarProps {
  form: TypedReactFormApi<EditablePost & { title: string }, PostSubmitMeta>;
  initialData: EditablePost;
  formType: "new" | "edit";
  mode: "publish" | "settings" | "sharing";
  currentUser: UsersCurrent | null;
  isSaving?: boolean;
  onClose?: () => void;
  addOnSubmitCallbackCustom: AddOnSubmitCallback<PostsEditMutationFragment>;
  addOnSuccessCallbackCustom: AddOnSuccessCallback<PostsEditMutationFragment>;
  addOnSubmitCallbackModerationGuidelines: AddOnSubmitCallback<PostsEditMutationFragment>;
  addOnSuccessCallbackModerationGuidelines: AddOnSuccessCallback<PostsEditMutationFragment>;
}

const EditorSettingsSidebar = ({
  form,
  initialData,
  formType,
  mode,
  currentUser,
  isSaving = false,
  onClose,
  addOnSubmitCallbackCustom,
  addOnSuccessCallbackCustom,
  addOnSubmitCallbackModerationGuidelines,
  addOnSuccessCallbackModerationGuidelines,
}: EditorSettingsSidebarProps) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const { flash } = useMessages();
  const { captureEvent } = useTracking();

  const isEvent = !!initialData.isEvent;
  const isDialogue = !!initialData.collabEditorDialogue;

  const isAdminOrMod = userIsAdminOrMod(currentUser);
  const canEditCoauthors = userCanEditCoauthors(currentUser);
  const canSeeHighlight = isAdminOrMod;
  const canSeeAdmin = isAdminOrMod;
  const canSeeAudio = userIsAdmin(currentUser) || userIsMemberOf(currentUser, "podcasters");
  const canSeeTags = !initialData.isEvent && !(isLWorAF() && !!initialData.collabEditorDialogue);
  const canSeeSocialPreview = !((isLWorAF() && !!initialData.collabEditorDialogue) || (isEAForum() && !!initialData.isEvent));
  const canShare = userCanUseSharing(currentUser);
  const contentType = initialData.contents?.originalContents?.type;
  const postId = initialData._id;
  const canSeeMarkdownToggle = contentType === "markdown"
    || (contentType === "lexical" && userUseMarkdownPostEditor(currentUser));

  const openVersionHistory = useCallback(() => {
    if (!postId) {
      return;
    }

    captureEvent("versionHistoryButtonClicked", { postId });
    openDialog({
      name: "PostVersionHistory",
      contents: ({ onClose }) => (
        <PostVersionHistoryDialog
          onClose={onClose}
          post={{
            ...initialData,
            userId: initialData.userId ?? null,
          }}
          postId={postId}
        />
      ),
    });
  }, [captureEvent, initialData, openDialog, postId]);

  const content = (
    <div className={classes.root}>
      {mode === "publish" && <>
        <div className={classes.submitArea}>
          <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting, draft: s.values.draft })}>
            {({ canSubmit, isSubmitting, draft }) => {
              const draftLabel = (isSubmitting && draft) ? "Saving…" : (!draft ? "Move to Drafts" : "Save Draft");
              const submitLabel = (isSubmitting && !draft) ? "Publishing…" : (draft ? "Publish" : "Publish Changes");
              const disabled = !canSubmit || isSubmitting || isSaving;

              return isDialogue
                ? <DialogueSubmit
                    formApi={form}
                    disabled={disabled}
                    submitLabel={submitLabel}
                    saveDraftLabel={draftLabel}
                  />
                : <>
                    <div className={classes.submitButtons}>
                      <PostSubmit
                        formApi={form}
                        disabled={disabled}
                        submitLabel={submitLabel}
                        saveDraftLabel={draftLabel}
                        feedbackLabel="Get Feedback"
                      />
                    </div>
                    {!isEvent && <div className={classes.frontpageCheckbox}>
                      <form.Field name="submitToFrontpage">
                        {(field) => <SubmitToFrontpageCheckbox field={field} />}
                      </form.Field>
                    </div>}
                  </>
            }}
          </form.Subscribe>
        </div>

        {canSeeSocialPreview && (
          <div className={classes.socialPreviewCard}>
            <div className={classes.socialPreviewCardTitle}>Social Preview</div>
            <form.Field name="socialPreview">
              {(field) => (
                <form.Subscribe selector={(state) => state.values.contents?.originalContents}>
                  {() => (
                    <SocialPreviewUpload field={field} post={form.state.values} />
                  )}
                </form.Subscribe>
              )}
            </form.Field>
          </div>
        )}
      </>}

      {mode === "sharing" && (
        <SharingPanel
          form={form}
          canShare={canShare}
          canEditCoauthors={canEditCoauthors}
          flash={flash}
        />
      )}

      {mode === "settings" && <div className={classes.panel}>
        {canSeeTags && (
          <AccordionSection title="Wikitags" defaultOpen contentClassName={classes.tagSection}>
            <form.Field name="tagRelevance">
              {() => (
                <FooterTagList
                  post={getFooterTagListPostInfo(initialData)}
                  hideScore
                  hidePostTypeTag
                  showCoreTags
                  link={false}
                />
              )}
            </form.Field>
          </AccordionSection>
        )}

        {hasGoogleDocImportSetting.get() && (
          <GoogleDocImportSection postId={initialData._id} />
        )}

        {canSeeMarkdownToggle && (
          <div className={classes.accordionSection}>
            <MarkdownEditorToggle form={form} />
          </div>
        )}

        {canSeeHighlight && (
          <AccordionSection title="Custom Highlight">
            <p className={classes.sectionText}><em>Admin only. Changes the post hover text.</em></p>
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
          </AccordionSection>
        )}

        <div className={classes.accordionSection}>
          <button
            type="button"
            className={classNames(classes.accordionHeader, classes.sectionActionButton)}
            onClick={openVersionHistory}
          >
            Version History
          </button>
        </div>

        <AccordionSection title="Moderation">
        {!isDialogue && (
          <div className={classes.fieldWrapper}>
            <form.Field name="moderationStyle">
              {(field) => (
                <div className={classes.moderationStyleRow}>
                  <div className={classes.moderationStyleLabel}>Style</div>
                  <Select
                    className={classes.moderationStyleSelect}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value as string)}
                    displayEmpty
                  >
                    {MODERATION_GUIDELINES_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </div>
              )}
            </form.Field>
          </div>
        )}

        <div className={classNames("form-component-EditorFormComponent", classes.fieldWrapper)}>
          <form.Field name="moderationGuidelines">
            {(field) => (
              <EditorFormComponent
                field={field}
                name="moderationGuidelines"
                formType={formType}
                document={form.state.values}
                addOnSubmitCallback={addOnSubmitCallbackModerationGuidelines}
                addOnSuccessCallback={addOnSuccessCallbackModerationGuidelines}
                hintText="Add your own moderation guidelines..."
                fieldName="moderationGuidelines"
                collectionName="Posts"
                commentEditor={true}
                commentStyles={true}
                hideControls={true}
              />
            )}
          </form.Field>
        </div>

        {!isDialogue && (
          <div className={classes.fieldWrapper}>
            <form.Field name="ignoreRateLimits">
              {(field) => (
                <LWTooltip title="Allow rate-limited users to comment freely on this post" placement="left-start" inlineBlock={false}>
                  <SidebarToggle field={field} label="Ignore rate limits" />
                </LWTooltip>
              )}
            </form.Field>
          </div>
        )}

        {userCanCommentLock(currentUser, { ...form.state.values, userId: form.state.values.userId ?? null }) && (
          <div className={classes.fieldWrapper}>
            <form.Field name="commentsLocked">
              {(field) => (
                <SidebarToggle field={field} label="Lock comments" />
              )}
            </form.Field>
          </div>
        )}

        {userCanCommentLock(currentUser, { ...form.state.values, userId: form.state.values.userId ?? null }) && (
          <div className={classes.fieldWrapper}>
            <form.Field name="commentsLockedToAccountsCreatedAfter">
              {(field) => (
                <FormComponentDatePicker field={field} label="Lock comments from accounts created after" />
              )}
            </form.Field>
          </div>
        )}

        {userIsAdmin(currentUser) && (
          <div className={classes.fieldWrapper}>
            <form.Field name="hideFrontpageComments">
              {(field) => (
                <SidebarToggle field={field} label="Hide frontpage comments" />
              )}
            </form.Field>
          </div>
        )}
        </AccordionSection>

        {canSeeAdmin && (
          <AccordionSection title="Admin Controls">
          <div className={classes.fieldWrapper}>
            <form.Field name="sticky">
              {(field) => <SidebarToggle field={field} label="Sticky" />}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="metaSticky">
                {(field) => <SidebarToggle field={field} label="Sticky (Meta)" />}
              </form.Field>
            </div>
          )}

          {isLWorAF() && (userIsAdmin(currentUser) || userIsMemberOf(currentUser, "alignmentForumAdmins")) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="afSticky">
                {(field) => <SidebarToggle field={field} label="Sticky (Alignment)" />}
              </form.Field>
            </div>
          )}

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
              {(field) => <SidebarToggle field={field} label="Make only accessible via link" />}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="legacy">
                {(field) => <SidebarToggle field={field} label="Legacy" />}
              </form.Field>
            </div>
          )}

          <div className={classes.fieldWrapper}>
            <form.Field name="disableRecommendation">
              {(field) => <SidebarToggle field={field} label="Exclude from Recommendations" />}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="forceAllowType3Audio">
                {(field) => <SidebarToggle field={field} label="Force allow type3 audio" />}
              </form.Field>
            </div>
          )}

          <div className={classes.fieldWrapper}>
            <form.Field name="defaultRecommendation">
              {(field) => <SidebarToggle field={field} label="Include in default recommendations" />}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="slug">
                {(field) => <MuiTextField field={field} label="Slug" updateOnBlur />}
              </form.Field>
            </div>
          )}

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="postedAt">
                {(field) => <FormComponentDatePicker field={field} label="Posted at" />}
              </form.Field>
            </div>
          )}

          <div className={classes.fieldWrapper}>
            <form.Field name="status">
              {(field) => <FormComponentSelect field={field} options={postStatusLabels} label="Status" />}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="userId">
                {(field) => (
                  <LWTooltip title="The user id of the author" placement="left-start" inlineBlock={false}>
                    <MuiTextField field={field} label="User ID" updateOnBlur />
                  </LWTooltip>
                )}
              </form.Field>
            </div>
          )}

          <div className={classes.fieldWrapper}>
            <form.Field name="authorIsUnreviewed">
              {(field) => <SidebarToggle field={field} label="Author is unreviewed" />}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="readTimeMinutesOverride">
                {(field) => (
                  <LWTooltip title="By default, this is calculated from the word count. Enter a value to override." placement="left-start" inlineBlock={false}>
                    <MuiTextField field={field} label="Read time (minutes)" updateOnBlur />
                  </LWTooltip>
                )}
              </form.Field>
            </div>
          )}

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="canonicalSource">
                {(field) => <MuiTextField field={field} label="Canonical source" updateOnBlur />}
              </form.Field>
            </div>
          )}

          {isLWorAF() && userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="manifoldReviewMarketId">
                {(field) => <MuiTextField field={field} label="Manifold review market ID" updateOnBlur />}
              </form.Field>
            </div>
          )}

          <div className={classes.fieldWrapper}>
            <form.Field name="noIndex">
              {(field) => <SidebarToggle field={field} label="No index" />}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="onlyVisibleToLoggedIn">
              {(field) => <SidebarToggle field={field} label="Hide from logged-out users" />}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="onlyVisibleToEstablishedAccounts">
              {(field) => <SidebarToggle field={field} label="Hide from logged-out & new accounts" />}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="hideFromRecentDiscussions">
              {(field) => <SidebarToggle field={field} label="Hide from recent discussions" />}
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

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="feedId">
                {(field) => <MuiTextField field={field} label="Feed ID" updateOnBlur />}
              </form.Field>
            </div>
          )}

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="feedLink">
                {(field) => <MuiTextField field={field} label="Feed link" updateOnBlur />}
              </form.Field>
            </div>
          )}

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="curatedDate">
                {(field) => <FormComponentDatePicker field={field} label="Curated date" />}
              </form.Field>
            </div>
          )}

          <div className={classes.fieldWrapper}>
            <form.Field name="metaDate">
              {(field) => <FormComponentDatePicker field={field} label="Meta date" />}
            </form.Field>
          </div>

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="reviewForCuratedUserId">
                {(field) => <MuiTextField field={field} label="Curated Review UserId" updateOnBlur />}
              </form.Field>
            </div>
          )}

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="commentSortOrder">
                {(field) => <MuiTextField field={field} label="Comment sort order" updateOnBlur />}
              </form.Field>
            </div>
          )}

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="hideAuthor">
                {(field) => <SidebarToggle field={field} label="Hide author" />}
              </form.Field>
            </div>
          )}

          {userIsAdmin(currentUser) && (
            <div className={classes.fieldWrapper}>
              <form.Field name="swrCachingEnabled">
                {(field) => <SidebarToggle field={field} label="stale-while-revalidate caching enabled" />}
              </form.Field>
            </div>
          )}
          </AccordionSection>
        )}

        {canSeeAudio && (
          <AccordionSection title="Audio">
          <div className={classes.fieldWrapper}>
            <form.Field name="podcastEpisodeId">
              {(field) => (
                <PodcastEpisodeInput field={field} document={form.state.values} />
              )}
            </form.Field>
          </div>
          </AccordionSection>
        )}
      </div>
      }

      {mode === "settings" && <Link to={tagGetUrl({ slug: "guide-to-the-lesswrong-editor" })} className={classes.editorGuideLink}>
        <ForumIcon icon="QuestionMarkCircle" className={classes.editorGuideIcon} />
        Editor Guide
      </Link>}
    </div>
  );

  if (onClose) {
    return (
      <ClickAwayListener
        onClickAway={onClose}
        ignoreClasses=".editor-sidebar-toggle, .MuiPopover-root, .ck-body-wrapper, .ck-balloon-panel"
      >
        {content}
      </ClickAwayListener>
    );
  }

  return content;
};

export default EditorSettingsSidebar;
