import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import type { InboxAction } from './inboxReducer';

const UpdateTagMutation = gql(`
  mutation updateTagTagReviewActions($selector: SelectorInput!, $data: UpdateTagDataInput!) {
    updateTag(selector: $selector, data: $data) {
      data {
        ...SunshineTagFragment
      }
    }
  }
`);

export function useTagReviewActions(
  tag: SunshineTagFragment | null,
  currentUser: UsersCurrent,
  dispatch: React.Dispatch<InboxAction>
) {
  const { flash } = useMessages();
  const [updateTag] = useMutation(UpdateTagMutation);

  const approveTag = useCallback(async () => {
    if (!tag) return;
    dispatch({ type: 'REMOVE_TAG', tagId: tag._id });
    try {
      await updateTag({
        variables: {
          selector: { _id: tag._id },
          data: {
            reviewedByUserId: currentUser._id,
            needsReview: false,
          },
        },
      });
    } catch (error) {
      flash({ messageString: `Failed to approve "${tag.name}" (reload to see it again): ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    }
  }, [tag, currentUser, updateTag, dispatch, flash]);

  const deleteTag = useCallback(async () => {
    if (!tag) return;
    if (!confirm(`Are you sure you want to delete the wikitag "${tag.name}"?`)) return;
    dispatch({ type: 'REMOVE_TAG', tagId: tag._id });
    try {
      await updateTag({
        variables: {
          selector: { _id: tag._id },
          data: {
            reviewedByUserId: currentUser._id,
            needsReview: false,
            deleted: true,
          },
        },
      });
    } catch (error) {
      flash({ messageString: `Failed to delete "${tag.name}" (reload to see it again): ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    }
  }, [tag, currentUser, updateTag, dispatch, flash]);

  return {
    approveTag,
    deleteTag,
  };
}
