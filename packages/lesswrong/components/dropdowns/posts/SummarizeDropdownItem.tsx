import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { userHasAutosummarize } from "../../../lib/betas";
import { useCurrentUser } from "../../common/withUser";
import { useDialog } from "../../common/withDialog";
import { PostSummaryDialog } from "../../languageModels/PostSummaryDialog";
import { DropdownItem } from "../DropdownItem";

const SummarizeDropdownItemInner = ({post, closeMenu}: {
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
      contents: ({onClose}) => <PostSummaryDialog
        onClose={onClose}
        post={post}
      />
    });
  }
  return (
    <DropdownItem
      title="Summarize"
      onClick={showPostSummary}
    />
  );
}

export const SummarizeDropdownItem = registerComponent(
  "SummarizeDropdownItem",
  SummarizeDropdownItemInner,
);


