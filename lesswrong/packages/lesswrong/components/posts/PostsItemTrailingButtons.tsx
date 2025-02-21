import React, { FC } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type { UsePostsItem } from "./usePostsItem";
import ArchiveIcon from "@material-ui/icons/Archive";
import UnarchiveIcon from "@material-ui/icons/Unarchive";
import CloseIcon from "@material-ui/icons/Close";
import { useCurrentUser } from "../common/withUser";
import { isBookUI } from "../../themes/forumTheme";
import { defineStyles, useStyles } from "../hooks/useStyles";

export const MENU_WIDTH = 18;

const dismissRecommendationTooltip = "Don't remind me to finish reading this sequence unless I visit it again";
const archiveDraftTooltip = "Archive this draft (hide from list)";
const restoreDraftTooltip = "Restore this draft (include in your main draft list)";

const styles = defineStyles("PostsItemTrailingButtons", (theme: ThemeType) => ({
  actions: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 0,
    right: -MENU_WIDTH - 6,
    width: MENU_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  archiveButton: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 1,
    right: -3*MENU_WIDTH,
    width: MENU_WIDTH,
    height: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  dismissButton: {
    cursor: "pointer",
  },
}));

type PostsItemTrailingButtonsProps = Pick<
  UsePostsItem,
  "post" |
  "showTrailingButtons" |
  "showMostValuableCheckbox" |
  "showDismissButton" |
  "showArchiveButton" |
  "resumeReading" |
  "onDismiss" |
  "onArchive"
>;

export const DismissButton = ({ onDismiss }: {
  onDismiss: () => void
}) => {
  const classes = useStyles(styles);
  return <Components.LWTooltip title={dismissRecommendationTooltip} placement="right">
    <CloseIcon className={classes.dismissButton} onClick={onDismiss} />
  </Components.LWTooltip>
};

const PostsItemTrailingButtons = ({
  post,
  showTrailingButtons,
  showMostValuableCheckbox,
  showDismissButton,
  showArchiveButton,
  resumeReading,
  onDismiss,
  onArchive,
}: PostsItemTrailingButtonsProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser()
  if (!showTrailingButtons || showMostValuableCheckbox) {
    return null;
  }

  const {LWTooltip, PostActionsButton} = Components;

  return (
    <>
      {(showDismissButton || resumeReading || isBookUI) && <div className={classes.actions}>
        {showDismissButton && <DismissButton {...{showDismissButton, onDismiss}} />}
        {isBookUI && !resumeReading && currentUser && <PostActionsButton post={post} vertical autoPlace />}
      </div>}
      {showArchiveButton && <div className={classes.archiveButton}>
        { post.deletedDraft ?
            <LWTooltip title={restoreDraftTooltip} placement="right">
              <UnarchiveIcon onClick={onArchive} />
            </LWTooltip> :
            <LWTooltip title={archiveDraftTooltip} placement="right">
              <ArchiveIcon onClick={onArchive} />
            </LWTooltip>
        }
      </div>}
    </>
  );
}

const PostsItemTrailingButtonsComponent = registerComponent("PostsItemTrailingButtons", PostsItemTrailingButtons);

declare global {
  interface ComponentTypes {
    PostsItemTrailingButtons: typeof PostsItemTrailingButtonsComponent
  }
}
