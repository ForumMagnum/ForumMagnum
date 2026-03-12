import { useCallback, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import type { InboxAction } from './inboxReducer';
import { VOTING_DISABLED } from '@/lib/collections/moderatorActions/constants';
import { useDebouncedCallback } from '@/components/hooks/useDebouncedCallback';
import type { MutateResult } from '@apollo/client';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserContentPermissions($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const CreateModeratorActionMutation = gql(`
  mutation createModeratorActionContentPermissions($data: CreateModeratorActionDataInput!) {
    createModeratorAction(data: $data) {
      data {
        _id
        type
        userId
        endedAt
      }
    }
  }
`);

const UpdateModeratorActionMutation = gql(`
  mutation updateModeratorActionContentPermissions($selector: SelectorInput!, $data: UpdateModeratorActionDataInput!) {
    updateModeratorAction(selector: $selector, data: $data) {
      data {
        _id
        type
        userId
        endedAt
      }
    }
  }
`);

type PermissionType = 'postingDisabled' | 'allCommentingDisabled' | 'conversationsDisabled';

const PERMISSION_NOTE_PREFIXES = {
  postingDisabled: 'publishing posts',
  allCommentingDisabled: 'all commenting',
  conversationsDisabled: 'messaging',
} satisfies Record<PermissionType, string>;

const PERMISSION_FIELDS = {
  postingDisabled: 'postingDisabled',
  allCommentingDisabled: 'allCommentingDisabled',
  conversationsDisabled: 'conversationsDisabled',
} satisfies Record<PermissionType, keyof SunshineUsersList>;

function createModNoteForPermission(
  permissionType: PermissionType,
  user: SunshineUsersList,
  currentUser: UsersCurrent | null
): string {
  const fieldName = PERMISSION_FIELDS[permissionType];
  const isCurrentlyDisabled = user[fieldName];
  const abled = isCurrentlyDisabled ? 'enabled' : 'disabled';

  const notePrefix = PERMISSION_NOTE_PREFIXES[permissionType];
  const modDisplayName = currentUser?.displayName ?? 'Unknown';
  const currentNotes = user.sunshineNotes || '';

  return getSignatureWithNote(modDisplayName, `${notePrefix} ${abled}`) + currentNotes;
}

export function useUserContentPermissions(
  user: SunshineUsersList | null,
  dispatch: React.ActionDispatch<[action: InboxAction]>
) {
  const currentUser = useCurrentUser();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [createModeratorAction] = useMutation(CreateModeratorActionMutation);
  const [updateModeratorAction] = useMutation(UpdateModeratorActionMutation);

  // Mutation queue to ensure sequential execution and prevent race conditions from sending the opposite-direction action before the previous one has finished
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const queueMutation = useCallback(async (mutationFn: () => Promise<any>) => {
    const currentQueue = mutationQueueRef.current;
    const newMutation = currentQueue
      .then(mutationFn)
      .catch(_ => {});
    mutationQueueRef.current = newMutation;
    return newMutation;
  }, []);

  const debouncedSourceOfTruthUpdate = useDebouncedCallback<MutateResult<updateUserContentPermissionsMutation>>(({ data }) => {
    const updatedUser = data?.updateUser?.data;
    if (updatedUser) {
      dispatch({ type: 'UPDATE_USER', userId: user!._id, fields: updatedUser });
    }
  }, {
    allowExplicitCallAfterUnmount: true,
    callOnLeadingEdge: false,
    onUnmount: 'callIfScheduled',
    rateLimitMs: 5000,
  });

  const updateUserWith = useCallback((data: UpdateUserDataInput) => {
    if (!user) return;

    void queueMutation(async () => {
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data,
        },
      }).then(debouncedSourceOfTruthUpdate);
    });
  }, [user, updateUser, debouncedSourceOfTruthUpdate, queueMutation]);

  const toggleDisablePosting = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('postingDisabled', user, currentUser);
    const newPostingDisabled = !user.postingDisabled;
    
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: newNotes, postingDisabled: newPostingDisabled } });
    
    updateUserWith({
      postingDisabled: newPostingDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const toggleDisableCommenting = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('allCommentingDisabled', user, currentUser);
    const newAllCommentingDisabled = !user.allCommentingDisabled;
    
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: newNotes, allCommentingDisabled: newAllCommentingDisabled } });
  
    updateUserWith({
      allCommentingDisabled: newAllCommentingDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const toggleDisableMessaging = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('conversationsDisabled', user, currentUser);
    const newConversationsDisabled = !user.conversationsDisabled;
    
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: newNotes, conversationsDisabled: newConversationsDisabled } });
    
    updateUserWith({
      conversationsDisabled: newConversationsDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const toggleDisableVoting = useCallback(async (disableOnly = false) => {
    if (!user || !currentUser) return;
    
    const modDisplayName = currentUser.displayName ?? 'Unknown';
    const currentNotes = user.sunshineNotes || '';
    
    // votingDisabled is a resolver field that checks for active VOTING_DISABLED moderator actions
    const isCurrentlyDisabled = user.votingDisabled;
    const abled = isCurrentlyDisabled ? 'enabled' : 'disabled';
    const newNotes = getSignatureWithNote(modDisplayName, `voting ${abled}`) + currentNotes;
    const newVotingDisabled = !isCurrentlyDisabled;
    
    // Perform optimistic update of the user's new votingDisabled state
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: newNotes, votingDisabled: newVotingDisabled } });
    
    if (isCurrentlyDisabled) {
      // Find and end the existing VOTING_DISABLED moderator action
      const votingDisabledAction = user.moderatorActions?.find(
        action => action.type === VOTING_DISABLED && !action.endedAt
      );
      
      if (votingDisabledAction && !disableOnly) {
        await updateModeratorAction({
          variables: {
            selector: { _id: votingDisabledAction._id },
            data: {
              endedAt: new Date(),
            },
          },
        });
      }
    } else {
      // Create a new moderator action
      await createModeratorAction({
        variables: {
          data: {
            userId: user._id,
            type: VOTING_DISABLED,
          },
        },
      });
    }
    
    const { data } = await updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          sunshineNotes: newNotes,
        },
      },
    });

    const updatedUser = data?.updateUser?.data;

    // Update the local state with the updated user data, in case some fast toggling resulted in a race condition that led to inconsistency between client & server.
    if (updatedUser) {
      dispatch({ type: 'UPDATE_USER', userId: user._id, fields: updatedUser });
    }
  }, [user, currentUser, updateModeratorAction, createModeratorAction, updateUser, dispatch]);

  return {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  };
}

