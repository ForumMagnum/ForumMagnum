import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import type { InboxAction } from './inboxReducer';
import { VOTING_DISABLED } from '@/lib/collections/moderatorActions/constants';

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

  const updateUserWith = useCallback((data: UpdateUserDataInput) => {
    if (!user) return;

    void updateUser({
      variables: {
        selector: { _id: user._id },
        data,
      },
    });
  }, [user, updateUser]);

  const toggleDisablePosting = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('postingDisabled', user, currentUser);
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    updateUserWith({
      postingDisabled: !user.postingDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const toggleDisableCommenting = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('allCommentingDisabled', user, currentUser);
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
  
    updateUserWith({
      allCommentingDisabled: !user.allCommentingDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const toggleDisableMessaging = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('conversationsDisabled', user, currentUser);
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    updateUserWith({
      conversationsDisabled: !user.conversationsDisabled,
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
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
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
    
    // Update user notes
    await updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          sunshineNotes: newNotes,
        },
      },
    });
  }, [user, currentUser, updateModeratorAction, createModeratorAction, updateUser, dispatch]);

  return {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  };
}

