import React from 'react';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog';
import { commentIsTopLevelQuickTake, userCanEditCommentRelevantTags } from '@/lib/collections/comments/helpers';
import DropdownItem from "../DropdownItem";
import EditQuickTakeTagsDialog from "./EditQuickTakeTagsDialog";

const QuickTakeTagsDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();

  const canEdit = userCanEditCommentRelevantTags(currentUser, comment);
  const tags = comment.relevantTags;
  if (!commentIsTopLevelQuickTake(comment) || comment.draft || (!tags.length && !canEdit)) {
    return null;
  }

  const title = tags.length
    ? `Tags: ${tags.map(tag => tag.name).join(", ")}`
    : "Add tags";
  const openEditDialog = () => openDialog({
    name: "EditQuickTakeTagsDialog",
    contents: ({onClose}) => <EditQuickTakeTagsDialog comment={comment} onClose={onClose} />,
  });

  return (
    <DropdownItem
      title={title}
      icon="Tag"
      tooltip="Used by frontpage tag filters"
      onClick={canEdit ? openEditDialog : undefined}
    />
  );
}

export default QuickTakeTagsDropdownItem;
