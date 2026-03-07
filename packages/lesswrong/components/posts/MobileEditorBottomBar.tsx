import React, { useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import ForumIcon from "../common/ForumIcon";
import EditorSettingsSidebar from "./EditorSettingsSidebar";
import type { EditablePost, PostSubmitMeta } from "@/lib/collections/posts/helpers";
import type { TypedReactFormApi } from "../tanstack-form-components/BaseAppForm";
import type { AddOnSubmitCallback, AddOnSuccessCallback } from "../editor/EditorFormComponent";

function getDraftLabel(post: { draft?: boolean | null } | null) {
  if (!post) return "Save Draft";
  if (!post.draft) return "Move to Drafts";
  return "Save Draft";
}

type SidebarMode = "publish" | "settings" | "sharing";

const styles = defineStyles("MobileEditorBottomBar", (theme: ThemeType) => ({
  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    gap: 8,
    background: theme.palette.panelBackground.default,
    borderTop: theme.palette.greyBorder("1px", 0.12),
    zIndex: theme.zIndexes.header - 1,
    [theme.breakpoints.up("lg")]: {
      display: "none",
    },
  },
  draftButton: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontWeight: 500,
    background: "none",
    border: theme.palette.greyBorder("1px", 0.14),
    borderRadius: 8,
    padding: "8px 14px",
    color: theme.palette.greyAlpha(0.68),
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.greyAlpha(0.04),
    },
    "&:disabled": {
      opacity: 0.45,
      cursor: "not-allowed",
    },
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: theme.palette.greyBorder("1px", 0.16),
    background: theme.palette.panelBackground.default,
    color: theme.palette.greyAlpha(0.75),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.greyAlpha(0.96),
      borderColor: theme.palette.greyAlpha(0.25),
    },
  },
  settingsButtonActive: {
    color: theme.palette.greyAlpha(0.98),
    borderColor: theme.palette.greyAlpha(0.34),
    background: theme.palette.greyAlpha(0.06),
  },
  publishButton: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontWeight: 500,
    background: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    border: "none",
    borderRadius: 8,
    padding: "8px 18px",
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.primary.dark,
    },
    "&:disabled": {
      opacity: 0.45,
      cursor: "not-allowed",
    },
  },
  settingsIcon: {
    width: 18,
    height: 18,
  },

  // Bottom sheet
  sheetOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.greyAlpha(0.5),
    zIndex: theme.zIndexes.drawer,
    opacity: 0,
    transition: "opacity 0.3s ease-in-out",
    pointerEvents: "none",
    [theme.breakpoints.up("lg")]: {
      display: "none",
    },
  },
  sheetOverlayVisible: {
    opacity: 1,
    pointerEvents: "auto",
  },
  sheetPanel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: theme.palette.panelBackground.default,
    borderRadius: "8px 8px 0 0",
    maxHeight: "85vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    transform: "translateY(100%)",
    transition: "transform 0.3s ease-out",
    zIndex: theme.zIndexes.drawer + 1,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    [theme.breakpoints.up("lg")]: {
      display: "none",
    },
  },
  sheetPanelOpen: {
    transform: "translateY(0)",
  },
  sheetHandle: {
    display: "flex",
    justifyContent: "center",
    padding: "12px 0 8px",
  },
  sheetHandlePill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: theme.palette.greyAlpha(0.2),
  },
  sheetTabs: {
    display: "flex",
    borderBottom: theme.palette.greyBorder("1px", 0.1),
    padding: "0 16px",
  },
  sheetTab: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 500,
    padding: "10px 16px",
    color: theme.palette.greyAlpha(0.5),
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    transition: "color 0.15s ease, border-color 0.15s ease",
    "&:hover": {
      color: theme.palette.greyAlpha(0.75),
    },
  },
  sheetTabActive: {
    color: theme.palette.greyAlpha(0.9),
    borderBottomColor: theme.palette.primary.main,
  },
  sheetContent: {
    padding: "12px 0 24px",

    // ── Override sidebar root: flat, full-width, proper padding ──
    "& .EditorSettingsSidebar-root": {
      position: "static",
      width: "100%",
      maxHeight: "none",
      height: "auto",
      right: "unset",
      top: "unset",
      overflowY: "visible",
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 16,
      paddingRight: 16,
      display: "block",
    },

    // ── Flatten all inner card containers (no nested bubbles) ──
    "& .EditorSettingsSidebar-panel": {
      border: "none",
      borderRadius: 0,
      padding: 0,
      background: "none",
    },
    "& .EditorSettingsSidebar-socialPreviewCard": {
      border: "none",
      borderRadius: 0,
      padding: 0,
      marginBottom: 0,
    },
    "& .EditorSettingsSidebar-sharingPanel": {
      border: "none",
      borderRadius: 0,
      padding: 0,
      marginBottom: 0,
    },

    // ── Submit area: tighter spacing ──
    "& .EditorSettingsSidebar-submitArea": {
      marginBottom: 10,
    },

    // ── Social preview: compact for mobile ──
    "& .EditorSettingsSidebar-socialPreviewCardTitle": {
      marginTop: 4,
    },
    "& .ImageUpload2-imageBackground": {
    },
  },
}));

const TABS: { key: SidebarMode; label: string }[] = [
  { key: "publish", label: "Publish" },
  { key: "settings", label: "Settings" },
  { key: "sharing", label: "Sharing" },
];

interface MobileEditorBottomBarProps {
  form: TypedReactFormApi<EditablePost & { title: string }, PostSubmitMeta>;
  initialData: EditablePost;
  formType: "new" | "edit";
  currentUser: UsersCurrent | null;
  isSaving?: boolean;
  sidebarPanel: SidebarMode | null;
  setSidebarPanel: React.Dispatch<React.SetStateAction<SidebarMode | null>>;
  addOnSubmitCallbackCustom: AddOnSubmitCallback<PostsEditMutationFragment>;
  addOnSuccessCallbackCustom: AddOnSuccessCallback<PostsEditMutationFragment>;
  addOnSubmitCallbackModerationGuidelines: AddOnSubmitCallback<PostsEditMutationFragment>;
  addOnSuccessCallbackModerationGuidelines: AddOnSuccessCallback<PostsEditMutationFragment>;
}

const MobileEditorBottomBar = ({
  form,
  initialData,
  formType,
  currentUser,
  isSaving = false,
  sidebarPanel,
  setSidebarPanel,
  addOnSubmitCallbackCustom,
  addOnSuccessCallbackCustom,
  addOnSubmitCallbackModerationGuidelines,
  addOnSuccessCallbackModerationGuidelines,
}: MobileEditorBottomBarProps) => {
  const classes = useStyles(styles);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarMode>("publish");

  const openSheet = () => {
    setSheetOpen(true);
    // Also open the corresponding sidebar panel so the desktop sidebar stays in sync
    setSidebarPanel(activeTab);
  };

  const closeSheet = () => {
    setSheetOpen(false);
  };

  const handleTabChange = (tab: SidebarMode) => {
    setActiveTab(tab);
    setSidebarPanel(tab);
  };

  return (
    <>
      {/* Fixed bottom bar */}
      <form.Subscribe selector={(s) => ({
        canSubmit: s.canSubmit,
        isSubmitting: s.isSubmitting,
        draft: s.values.draft,
      })}>
        {({ canSubmit, isSubmitting, draft }) => {
          const disabled = !canSubmit || isSubmitting || isSaving;
          return (
            <div className={classes.bottomBar}>
              <button
                type="submit"
                className={classes.draftButton}
                disabled={disabled}
                onClick={() => form.setFieldValue("draft", true)}
              >
                {getDraftLabel({ draft })}
              </button>
              <div className={classes.rightGroup}>
                <button
                  type="button"
                  className={classNames(
                    classes.settingsButton,
                    sheetOpen && classes.settingsButtonActive,
                  )}
                  onClick={() => sheetOpen ? closeSheet() : openSheet()}
                >
                  <ForumIcon icon="Settings" className={classes.settingsIcon} />
                </button>
                <button
                  type="submit"
                  className={classes.publishButton}
                  disabled={disabled}
                  onClick={() => form.setFieldValue("draft", false)}
                >
                  {draft ? "Publish" : "Publish Changes"}
                </button>
              </div>
            </div>
          );
        }}
      </form.Subscribe>

      {/* Bottom sheet overlay */}
      <div
        className={classNames(
          classes.sheetOverlay,
          sheetOpen && classes.sheetOverlayVisible,
        )}
        onClick={closeSheet}
      />

      {/* Bottom sheet panel */}
      <div
        className={classNames(
          classes.sheetPanel,
          sheetOpen && classes.sheetPanelOpen,
        )}
      >
        <div className={classes.sheetHandle}>
          <div className={classes.sheetHandlePill} />
        </div>
        <div className={classes.sheetTabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={classNames(
                classes.sheetTab,
                activeTab === tab.key && classes.sheetTabActive,
              )}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={classes.sheetContent}>
          <EditorSettingsSidebar
            form={form}
            initialData={initialData}
            formType={formType}
            mode={activeTab}
            currentUser={currentUser}
            addOnSubmitCallbackCustom={addOnSubmitCallbackCustom}
            addOnSuccessCallbackCustom={addOnSuccessCallbackCustom}
            addOnSubmitCallbackModerationGuidelines={addOnSubmitCallbackModerationGuidelines}
            addOnSuccessCallbackModerationGuidelines={addOnSuccessCallbackModerationGuidelines}
          />
        </div>
      </div>
    </>
  );
};

export default MobileEditorBottomBar;
