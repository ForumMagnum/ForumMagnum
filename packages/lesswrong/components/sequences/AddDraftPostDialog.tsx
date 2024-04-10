import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMessages } from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { useDialog } from '../common/withDialog';

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

  const { LWDialog, SequenceDraftsList } = Components;

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
