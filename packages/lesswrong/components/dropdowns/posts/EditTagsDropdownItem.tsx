import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useDialog } from "../../common/withDialog";

import { taggingNamePluralCapitalSetting } from "../../../lib/instanceSettings";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import { EditTagsDialog } from "../../tagging/EditTagsDialog";
import { DropdownItem } from "../DropdownItem";

const EditTagsDropdownItemInner = ({post, closeMenu}: {
  post: PostsList | SunshinePostsList,
  closeMenu?: () => void,
}) => {
  const {openDialog} = useDialog();

  const handleOpenTagDialog = async () => {
    closeMenu?.();
    openDialog({
      name: "EditTagsDialog",
      contents: ({onClose}) => <EditTagsDialog onClose={onClose} post={post} />
    });
  }
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


