import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMessages } from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';
import DialogActions from '@/lib/vendor/@material-ui/core/src/DialogActions';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
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
