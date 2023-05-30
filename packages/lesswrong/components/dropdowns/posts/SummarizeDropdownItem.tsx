import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { userHasAutosummarize } from "../../../lib/betas";
import { useCurrentUser } from "../../common/withUser";
import { useDialog } from "../../common/withDialog";

const SummarizeDropdownItem = ({post, closeMenu}: {
  post: PostsList|SunshinePostsList,
  closeMenu?: () => void,
}) => {
  const {openDialog} = useDialog();
  const currentUser = useCurrentUser();
  if (!userHasAutosummarize(currentUser)) {
    return null;
  }

  const showPostSummary = () => {
    closeMenu?.();
    openDialog({
      componentName: "PostSummaryDialog",
      componentProps: {post},
    });
  }

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title="Summarize"
      onClick={showPostSummary}
    />
  );
}

const SummarizeDropdownItemComponent = registerComponent(
  "SummarizeDropdownItem",
  SummarizeDropdownItem,
);

declare global {
  interface ComponentTypes {
    SummarizeDropdownItem: typeof SummarizeDropdownItemComponent
  }
}
