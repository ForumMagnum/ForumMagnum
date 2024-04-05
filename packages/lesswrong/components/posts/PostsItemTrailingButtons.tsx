import React, { FC } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { UsePostsItem } from "./usePostsItem";
import ArchiveIcon from "@material-ui/icons/Archive";
import UnarchiveIcon from "@material-ui/icons/Unarchive";
import CloseIcon from "@material-ui/icons/Close";
import { useCurrentUser } from "../common/withUser";
import { isBookUI } from "../../themes/forumTheme";

export const MENU_WIDTH = 18;

const dismissRecommendationTooltip = "Don't remind me to finish reading this sequence unless I visit it again";
const archiveDraftTooltip = "Archive this draft (hide from list)";
const restoreDraftTooltip = "Restore this draft (include in your main draft list)";

type DismissButtonProps = Pick<UsePostsItem, "showDismissButton" | "onDismiss">;

export const DismissButton: FC<DismissButtonProps> = ({
  showDismissButton,
  onDismiss,
}) => showDismissButton
  ? (
    <Components.LWTooltip title={dismissRecommendationTooltip} placement="right">
      <CloseIcon onClick={onDismiss} />
    </Components.LWTooltip>
  )
  : null;

const styles = (theme: ThemeType): JssStyles => ({
  actions: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 0,
    right: -MENU_WIDTH - 6,
    width: MENU_WIDTH,
    height: "100%",
    cursor: "pointer",
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
});

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
> & {classes: ClassesType};

const PostsItemTrailingButtons = ({
  post,
  showTrailingButtons,
  showMostValuableCheckbox,
  showDismissButton,
  showArchiveButton,
  resumeReading,
  onDismiss,
  onArchive,
  classes,
}: PostsItemTrailingButtonsProps) => {
  const currentUser = useCurrentUser()
  if (!showTrailingButtons || showMostValuableCheckbox) {
    return null;
  }

  const {LWTooltip, PostActionsButton} = Components;

  return (
    <>
      {(showDismissButton || resumeReading || isBookUI) && <div className={classes.actions}>
        <DismissButton {...{showDismissButton, onDismiss}} />
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

const PostsItemTrailingButtonsComponent = registerComponent(
  "PostsItemTrailingButtons",
  PostsItemTrailingButtons,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsItemTrailingButtons: typeof PostsItemTrailingButtonsComponent
  }
}
