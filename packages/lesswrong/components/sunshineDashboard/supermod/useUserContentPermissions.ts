import { useCallback, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useCurrentUser } from '@/components/common/withUser';
import type { InboxAction } from './inboxReducer';
import { VOTING_DISABLED } from '@/lib/collections/moderatorActions/constants';
import { useDebouncedCallback } from '@/components/hooks/useDebouncedCallback';
import { areAllContentPermissionsDisabled } from './helpers';
import { getOptimisticNotes, useAddModeratorNote } from '../useAddModeratorNote';

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

function createModNoteForPermission(permissionType: PermissionType, user: SunshineUsersList): string {
  const fieldName = PERMISSION_FIELDS[permissionType];
  const isCurrentlyDisabled = user[fieldName];
  const abled = isCurrentlyDisabled ? 'enabled' : 'disabled';

  const notePrefix = PERMISSION_NOTE_PREFIXES[permissionType];
  return `${notePrefix} ${abled}`;
}

export function useUserContentPermissions(
  user: SunshineUsersList | null,
  dispatch: React.ActionDispatch<[action: InboxAction]>
) {
  const currentUser = useCurrentUser();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [createModeratorAction] = useMutation(CreateModeratorActionMutation);
  const [updateModeratorAction] = useMutation(UpdateModeratorActionMutation);
  const addModeratorNote = useAddModeratorNote();

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

  const debouncedSourceOfTruthUpdate = useDebouncedCallback<SunshineUsersList | null>((updatedUser) => {
    if (updatedUser) {
      dispatch({ type: 'UPDATE_USER', userId: updatedUser._id, fields: updatedUser });
    }
  }, {
    allowExplicitCallAfterUnmount: true,
    callOnLeadingEdge: false,
    onUnmount: 'callIfScheduled',
    rateLimitMs: 5000,
  });

  const updateUserWithNote = useCallback((data: UpdateUserDataInput, note: string) => {
    if (!user) return;

    void queueMutation(async () => {
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data,
        },
      });
      debouncedSourceOfTruthUpdate(await addModeratorNote(user._id, note));
    });
  }, [user, updateUser, addModeratorNote, debouncedSourceOfTruthUpdate, queueMutation]);

  const toggleDisablePosting = useCallback(() => {
    if (!user || !currentUser) return;
    const note = createModNoteForPermission('postingDisabled', user);
    const newPostingDisabled = !user.postingDisabled;
    
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: getOptimisticNotes(user.sunshineNotes, currentUser.displayName, note), postingDisabled: newPostingDisabled } });
    
    updateUserWithNote({
      postingDisabled: newPostingDisabled,
    }, note);
  }, [user, currentUser, updateUserWithNote, dispatch]);

  const toggleDisableCommenting = useCallback(() => {
    if (!user || !currentUser) return;
    const note = createModNoteForPermission('allCommentingDisabled', user);
    const newAllCommentingDisabled = !user.allCommentingDisabled;
    
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: getOptimisticNotes(user.sunshineNotes, currentUser.displayName, note), allCommentingDisabled: newAllCommentingDisabled } });
  
    updateUserWithNote({
      allCommentingDisabled: newAllCommentingDisabled,
    }, note);
  }, [user, currentUser, updateUserWithNote, dispatch]);

  const toggleDisableMessaging = useCallback(() => {
    if (!user || !currentUser) return;
    const note = createModNoteForPermission('conversationsDisabled', user);
    const newConversationsDisabled = !user.conversationsDisabled;
    
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: getOptimisticNotes(user.sunshineNotes, currentUser.displayName, note), conversationsDisabled: newConversationsDisabled } });
    
    updateUserWithNote({
      conversationsDisabled: newConversationsDisabled,
    }, note);
  }, [user, currentUser, updateUserWithNote, dispatch]);

  const toggleDisableVoting = useCallback(async (disableOnly = false) => {
    if (!user || !currentUser) return;
    
    // votingDisabled is a resolver field that checks for active VOTING_DISABLED moderator actions
    const isCurrentlyDisabled = user.votingDisabled;
    const abled = isCurrentlyDisabled ? 'enabled' : 'disabled';
    const note = `voting ${abled}`;
    const newVotingDisabled = !isCurrentlyDisabled;
    
    // Perform optimistic update of the user's new votingDisabled state
    dispatch({ type: 'UPDATE_USER', userId: user._id, fields: { sunshineNotes: getOptimisticNotes(user.sunshineNotes, currentUser.displayName, note), votingDisabled: newVotingDisabled } });
    
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
    
    const updatedUser = await addModeratorNote(user._id, note);

    // Update the local state with the updated user data, in case some fast toggling resulted in a race condition that led to inconsistency between client & server.
    if (updatedUser) {
      dispatch({ type: 'UPDATE_USER', userId: user._id, fields: updatedUser });
    }
  }, [user, currentUser, updateModeratorAction, createModeratorAction, addModeratorNote, dispatch]);

  const toggleAllPermissions = useCallback(() => {
    if (!user || !currentUser) return;

    const disableAll = !areAllContentPermissionsDisabled(user);
    const abled = disableAll ? 'disabled' : 'enabled';
    const note = `all permissions ${abled}`;

    dispatch({
      type: 'UPDATE_USER',
      userId: user._id,
      fields: {
        sunshineNotes: getOptimisticNotes(user.sunshineNotes, currentUser.displayName, note),
        postingDisabled: disableAll,
        allCommentingDisabled: disableAll,
        conversationsDisabled: disableAll,
        votingDisabled: disableAll,
      },
    });

    void queueMutation(async () => {
      if (disableAll) {
        if (!user.votingDisabled) {
          await createModeratorAction({
            variables: {
              data: {
                userId: user._id,
                type: VOTING_DISABLED,
              },
            },
          });
        }
      } else {
        const votingDisabledAction = user.moderatorActions?.find(
          action => action.type === VOTING_DISABLED && !action.endedAt
        );
        if (votingDisabledAction) {
          await updateModeratorAction({
            variables: {
              selector: { _id: votingDisabledAction._id },
              data: { endedAt: new Date() },
            },
          });
        }
      }

      await updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            postingDisabled: disableAll,
            allCommentingDisabled: disableAll,
            conversationsDisabled: disableAll,
          },
        },
      });
      debouncedSourceOfTruthUpdate(await addModeratorNote(user._id, note));
    });
  }, [user, currentUser, dispatch, queueMutation, createModeratorAction, updateModeratorAction, updateUser, addModeratorNote, debouncedSourceOfTruthUpdate]);

  return {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
    toggleAllPermissions,
  };
}

