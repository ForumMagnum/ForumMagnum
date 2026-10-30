import React, { useState } from 'react';
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { DialogActions } from '@/components/widgets/DialogActions';
import { DialogContent } from '@/components/widgets/DialogContent';
import { DialogTitle } from '@/components/widgets/DialogTitle';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import LWDialog from "../../common/LWDialog";
import Loading from "../../vulcan-core/Loading";
import TagsChecklist, { type ChecklistTag } from "../../tagging/TagsChecklist";
import AddTagButton from "../../tagging/AddTagButton";
import { useCoreTags } from "../../tagging/useCoreTags";
import { useMessages } from '../../common/withMessages';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const CommentsListUpdateMutation = gql(`
  mutation updateCommentEditQuickTakeTagsDialog($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const styles = defineStyles('EditQuickTakeTagsDialog', (theme: ThemeType) => ({
  description: {
    ...theme.typography.body2,
    color: theme.palette.text.dim,
    marginTop: 0,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 4,
  },
}));

const EditQuickTakeTagsDialog = ({comment, onClose}: {
  comment: CommentsList,
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const { data, loading } = useCoreTags();
  const [selectedTags, setSelectedTags] = useState<ChecklistTag[]>(comment.relevantTags);
  const [updateComment, { loading: saving }] = useMutation(CommentsListUpdateMutation);

  const coreTags = data?.tags?.results ?? [];
  const selectedNonCoreTags = selectedTags.filter(tag => !coreTags.some(coreTag => coreTag._id === tag._id));
  const selectedTagIds = selectedTags.map(tag => tag._id);

  const addTag = ({tagId, tagName}: {tagId: string, tagName: string}) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTags([...selectedTags, { _id: tagId, name: tagName, shortName: null }]);
    }
  };
  const removeTag = ({tagId}: {tagId: string}) => {
    setSelectedTags(selectedTags.filter(tag => tag._id !== tagId));
  };

  const save = async () => {
    try {
      await updateComment({
        variables: {
          selector: { _id: comment._id },
          data: { relevantTagIds: selectedTagIds },
        },
      });
      onClose();
    } catch (e) {
      flash(e.message);
    }
  };

  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>Quick take tags</DialogTitle>
      <DialogContent>
        <p className={classes.description}>
          Readers use tags to filter the quick takes on the frontpage. Quick takes are tagged automatically when they're posted.
        </p>
        {loading
          ? <Loading />
          : <div className={classes.tags}>
            <TagsChecklist
              tags={[...coreTags, ...selectedNonCoreTags]}
              selectedTagIds={selectedTagIds}
              displaySelected="highlight"
              onTagSelected={addTag}
              onTagRemoved={removeTag}
              tooltips={false}
            />
            <AddTagButton onTagSelected={addTag} />
          </div>
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>Save</Button>
      </DialogActions>
    </LWDialog>
  );
}

export default EditQuickTakeTagsDialog;
