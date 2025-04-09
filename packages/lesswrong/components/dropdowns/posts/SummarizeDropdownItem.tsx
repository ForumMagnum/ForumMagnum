import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
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
      name: "PostSummaryDialog",
      contents: ({onClose}) => <Components.PostSummaryDialog
        onClose={onClose}
        post={post}
      />
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
