import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { useDialog } from "../../common/withDialog";

import { taggingNamePluralCapitalSetting } from "../../../lib/instanceSettings";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "@/components/dropdowns/DropdownItem";

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

export default EditTagsDropdownItemComponent;
