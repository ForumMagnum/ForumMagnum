import React, { useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMessages } from "../common/withMessages";
import { DialogActions } from '../widgets/DialogActions';
import { DialogContent } from "@/components/widgets/DialogContent";
import { DialogTitle } from "@/components/widgets/DialogTitle";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useDialog } from '../common/withDialog';
import LWDialog from "../common/LWDialog";
import SequenceDraftsList from "./SequenceDraftsList";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const ChaptersFragmentUpdateMutation = gql(`
  mutation updateChapterAddDraftPostDialog($selector: SelectorInput!, $data: UpdateChapterDataInput!) {
    updateChapter(selector: $selector, data: $data) {
      data {
        ...ChaptersFragment
      }
    }
  }
`);

const AddDraftPostDialog = ({documentId, postIds, onClose}: {
  documentId: string,
  postIds: string[],
  onClose?: () => void,
}) => {
  const { flash } = useMessages();
  const [dialogPostIds, setDialogPostIds] = useState(postIds)
  const { closeDialog } = useDialog()

  const [updatePostIds] = useMutation(ChaptersFragmentUpdateMutation);

  const addDraft = useCallback((newPostId: string) => {
    if (dialogPostIds.includes(newPostId)) {
      flash("That draft is already in the sequence")
      return
    }
    setDialogPostIds([...dialogPostIds, newPostId])
    void updatePostIds({
      variables: {
        selector: { _id: documentId },
        data: { postIds: [...dialogPostIds, newPostId] }
      }
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

export default registerComponent(
  'AddDraftPostDialog', AddDraftPostDialog
);


