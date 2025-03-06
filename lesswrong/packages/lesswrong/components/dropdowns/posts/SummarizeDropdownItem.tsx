import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { userHasAutosummarize } from "../../../lib/betas";
import { useCurrentUser } from "../../common/withUser";
import { useDialog } from "../../common/withDialog";
import DropdownItem from "@/components/dropdowns/DropdownItem";

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

export default SummarizeDropdownItemComponent;
