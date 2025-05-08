import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { useDialog } from "../../common/withDialog";

import { taggingNamePluralCapitalSetting } from "../../../lib/instanceSettings";
import { preferredHeadingCase } from "../../../themes/forumTheme";

const EditTagsDropdownItemInner = ({post, closeMenu}: {
  post: PostsList | SunshinePostsList,
  closeMenu?: () => void,
}) => {
  const {openDialog} = useDialog();

  const handleOpenTagDialog = async () => {
    closeMenu?.();
    openDialog({
      name: "EditTagsDialog",
      contents: ({onClose}) => <Components.EditTagsDialog onClose={onClose} post={post} />
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

export const EditTagsDropdownItem = registerComponent(
  "EditTagsDropdownItem",
  EditTagsDropdownItemInner,
);

declare global {
  interface ComponentTypes {
    EditTagsDropdownItem: typeof EditTagsDropdownItem
  }
}
