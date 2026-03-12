import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useCoreTags } from '@/components/tagging/useCoreTags';
import AddTagButton from '@/components/tagging/AddTagButton';
import { useCoreTagsKeyboard } from '@/components/tagging/CoreTagsKeyboardContext';
import { useMessages } from '@/components/common/withMessages';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { randomId } from '@/lib/random';
import { InboxAction } from './inboxReducer';
import TagsChecklist from '@/components/tagging/TagsChecklist';

const styles = defineStyles('ModeratorCoreTagsChecklist', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  addTagButton: {
    display: 'inline-block',
  },
}));

const ModeratorCoreTagsChecklist = ({
  post,
  dispatch,
}: {
  post: SunshinePostsList;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const { data, loading } = useCoreTags();
  const context = useCoreTagsKeyboard();
  const { flash } = useMessages();

  const coreTags = useMemo(() => data?.tags?.results ?? [], [data?.tags?.results]);
  const tagRels = useMemo(() => post.tagRels ?? [], [post.tagRels]);

  const existingTagIds = useMemo(() => (
    tagRels
      .filter(tr => tr.baseScore > 0)
      .map(tr => tr.tag)
      .filter(t => !!t)
      .map(t => t._id)
  ), [tagRels]);

  const [addOrUpvoteTag] = useMutation(gql(`
    mutation addOrUpvoteTagModeratorCoreTagsChecklist($tagId: String, $postId: String) {
      addOrUpvoteTag(tagId: $tagId, postId: $postId) {
        ...TagRelMinimumFragment
      }
    }
  `));

  const [removeTagVote] = useMutation(gql(`
    mutation performVoteTagRelModeratorCoreTagsChecklist($documentId: String, $voteType: String, $extendedVote: JSON) {
      performVoteTagRel(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
        document {
          ...WithVoteTagRel
        }
      }
    }
  `));

  // Mutation queue keyed by tag ID to ensure sequential execution per tag
  // while allowing mutations for different tags to run in parallel
  const mutationQueueRef = useRef<Map<string, Promise<void>>>(new Map());

  const queueTagMutation = useCallback(async (tagId: string, mutationFn: () => Promise<any>) => {
    const currentQueue = mutationQueueRef.current.get(tagId) ?? Promise.resolve();
    const newMutation = currentQueue
      .then(mutationFn)
      .catch(_ => {});
    mutationQueueRef.current.set(tagId, newMutation);
    return newMutation;
  }, []);

  const onTagSelected = useCallback(async (tag: {tagId: string, tagName: string}, currentExistingTagIds: string[]) => {
    const existingTagRel = tagRels.find(tr => tr.tag?._id === tag.tagId);
    const tagRelsWithoutExistingTag = tagRels.filter(tr => tr.tag?._id !== tag.tagId);

    const optimisticId = randomId();

    const newTagRel: SunshinePostsList_Post_tagRels_TagRel = existingTagRel ? { ...existingTagRel, baseScore: 1 } : {
      __typename: "TagRel" as const,
      _id: optimisticId,
      tagId: tag.tagId,
      baseScore: 1,
      currentUserVote: 'smallUpvote',
      currentUserExtendedVote: null,
      currentUserCanVote: true,
      afBaseScore: null,
      extendedScore: null,
      score: 1,
      voteCount: 1,
      autoApplied: false,
      postId: post._id,
      tag: coreTags.find(t => t._id === tag.tagId) ?? null,
    };

    dispatch({ type: 'UPDATE_POST', postId: post._id, fields: { tagRels: [...tagRelsWithoutExistingTag, newTagRel] } });
    
    return queueTagMutation(tag.tagId, async () => {
      try {
        await addOrUpvoteTag({
          variables: {
            tagId: tag.tagId,
            postId: post._id,
          },
        }).then(result => {
          const upvotedTagRel = result.data?.addOrUpvoteTag;
          if (upvotedTagRel) {
            if (!existingTagRel) {
              dispatch({ type: 'UPDATE_POST', postId: post._id, fields: { tagRels: [...tagRelsWithoutExistingTag, upvotedTagRel] } });
            }
          }
        });
      } catch (e) {
        flash(e.message);
      }
    });
  }, [tagRels, post._id, coreTags, dispatch, queueTagMutation, addOrUpvoteTag, flash]);

  const onTagRemoved = useCallback(async (tag: {tagId: string, tagName: string}, currentExistingTagIds: string[]) => {
    const tagRel = tagRels.find(tr => tr.tag?._id === tag.tagId);
    if (!tagRel) return;

    const updatedTagRels = tagRels.map(tr => tr.tag?._id === tag.tagId ? { ...tr, baseScore: 0 } : tr);

    dispatch({ type: 'UPDATE_POST', postId: post._id, fields: { tagRels: updatedTagRels } });
    
    return queueTagMutation(tag.tagId, async () => {
      try {
        // Remove the tag by canceling the vote (setting voteType to null)
        await removeTagVote({
          variables: {
            documentId: tagRel._id,
            voteType: null,
            extendedVote: null,
          },
        });
      } catch (e) {
        flash(e.message);
      }
    });
  }, [tagRels, dispatch, post._id, queueTagMutation, removeTagVote, flash]);

  // Map tags to shortcuts and register with context
  const coreTagsWithShortcuts = useMemo(() => {
    if (!data?.tags?.results) return [];
    
    return data.tags.results.slice(0, 9).map((tag, index) => ({
      tagId: tag._id,
      tagName: tag.name,
      shortcut: String(index + 1),
    }));
  }, [data?.tags?.results]);

  const keyboardShortcuts = useMemo(() => {
    const shortcuts: Record<string, string> = {};
    coreTagsWithShortcuts.forEach(({ tagId, shortcut }) => {
      shortcuts[tagId] = shortcut;
    });
    return shortcuts;
  }, [coreTagsWithShortcuts]);

  useEffect(() => {
    if (context && coreTagsWithShortcuts.length > 0) {
      context.registerCoreTagsKeyboard(
        coreTagsWithShortcuts,
        onTagSelected,
        onTagRemoved
      );
    }
  }, [context, coreTagsWithShortcuts, onTagSelected, onTagRemoved]);

  const handleAddTag = useCallback((tag: {tagId: string, tagName: string}) => {
    void onTagSelected(tag, existingTagIds);
  }, [onTagSelected, existingTagIds]);

  return (
    <div className={classes.root}>
      <TagsChecklist
        tags={coreTags}
        selectedTagIds={existingTagIds}
        onTagSelected={onTagSelected}
        onTagRemoved={onTagRemoved}
        keyboardShortcuts={keyboardShortcuts}
        displaySelected="highlight"
      />
      <div className={classes.addTagButton}>
        <AddTagButton onTagSelected={handleAddTag} isVotingContext />
      </div>
    </div>
  );
};

export default ModeratorCoreTagsChecklist;

