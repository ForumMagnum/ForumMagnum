import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { useDialog } from "../../common/withDialog";

import { taggingNamePluralCapitalSetting } from "../../../lib/instanceSettings";
import { preferredHeadingCase } from "../../../themes/forumTheme";

const EditTagsDropdownItem = ({post, closeMenu}: {
  post: PostsList | SunshinePostsList,
  closeMenu?: () => void,
}) => {
  const {openDialog} = useDialog();

  const handleOpenTagDialog = async () => {
    closeMenu?.();
    openDialog({
      componentName: "EditTagsDialog",
      componentProps: {post},
    });
  }

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={preferredHeadingCase(`Edit ${taggingNamePluralCapitalSetting.get()}`)}
      onClick={handleOpenTagDialog}
      icon="Tag"
    />
  );
}

const EditTagsDropdownItemComponent = registerComponent(
  "EditTagsDropdownItem",
  EditTagsDropdownItem,
);

declare global {
  interface ComponentTypes {
    EditTagsDropdownItem: typeof EditTagsDropdownItemComponent
  }
}
