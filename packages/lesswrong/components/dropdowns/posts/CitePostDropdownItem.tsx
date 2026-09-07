import React from "react";
import { useDialog } from "../../common/withDialog";
import { useTracking } from "../../../lib/analyticsEvents";
import type { PostCitationSource } from "../../../lib/collections/posts/citations";
import CitePostDialog from "../../posts/CitePostDialog";
import DropdownItem from "../DropdownItem";

const CitePostDropdownItem = ({post, closeMenu}: {
  post: PostCitationSource,
  closeMenu?: () => void,
}) => {
  const {openDialog} = useDialog();
  const {captureEvent} = useTracking();

  const showCiteDialog = () => {
    captureEvent("citePostClicked", {postId: post._id});
    closeMenu?.();
    openDialog({
      name: "CitePostDialog",
      contents: ({onClose}) => <CitePostDialog post={post} onClose={onClose} />,
    });
  };

  return (
    <DropdownItem
      title="Cite"
      icon="Document"
      onClick={showCiteDialog}
    />
  );
};

export default CitePostDropdownItem;
