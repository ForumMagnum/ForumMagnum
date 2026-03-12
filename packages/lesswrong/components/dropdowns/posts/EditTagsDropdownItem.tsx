import React from "react";
import { useDialog } from "../../common/withDialog";
import EditTagsDialog from "../../tagging/EditTagsDialog";
import DropdownItem from "../DropdownItem";

const EditTagsDropdownItem = ({post, closeMenu}: {
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
      title={`Edit Wikitags`}
      onClick={handleOpenTagDialog}
      icon="Tag"
    />
  );
}

export default EditTagsDropdownItem;


