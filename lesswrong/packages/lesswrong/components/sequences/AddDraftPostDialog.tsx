import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMessages } from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';
import { useDialog } from '../common/withDialog';
import LWDialog from "@/components/common/LWDialog";
import SequenceDraftsList from "@/components/sequences/SequenceDraftsList";
import { DialogActions, DialogContent, DialogTitle, Button } from "@/components/mui-replacement";

const AddDraftPostDialog = ({documentId, postIds, onClose}: {
  documentId: string,
  postIds: string[],
  onClose?: () => void,
}) => {
  const { flash } = useMessages();
  const [dialogPostIds, setDialogPostIds] = useState(postIds)
  const { closeDialog } = useDialog()

  const {mutate: updatePostIds} = useUpdate({
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
  });

  const addDraft = useCallback((newPostId: string) => {
    if (dialogPostIds.includes(newPostId)) {
      flash("That draft is already in the sequence")
      return
    }
    setDialogPostIds([...dialogPostIds, newPostId])
    void updatePostIds({
      selector: {_id: documentId},
      data: {postIds: [...dialogPostIds, newPostId]}
    })
  }, [documentId, updatePostIds, dialogPostIds, flash])
  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>
      Add Draft Post
      </DialogTitle>
      <DialogContent>
        <SequenceDraftsList limit={10} title={"Drafts"} addDraft={addDraft} dialogPostIds={dialogPostIds} />
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={closeDialog}>
          Done
        </Button>
      </DialogActions>
    </LWDialog>
  )
}

const AddDraftPostDialogComponent = registerComponent(
  'AddDraftPostDialog', AddDraftPostDialog
);

declare global {
  interface ComponentTypes {
    AddDraftPostDialog: typeof AddDraftPostDialogComponent
  }
}

export default AddDraftPostDialogComponent;
