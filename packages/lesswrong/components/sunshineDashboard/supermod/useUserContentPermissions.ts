import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import type { InboxAction } from './inboxReducer';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserContentPermissions($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
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

  const updateUserWith = useCallback((data: UpdateUserDataInput) => {
    if (!user) return;

    void updateUser({
      variables: {
        selector: { _id: user._id },
        data,
      },
    });
  }, [user, updateUser]);

  const handleDisablePosting = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('postingDisabled', user, currentUser);
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    updateUserWith({
      postingDisabled: !user.postingDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const handleDisableCommenting = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('allCommentingDisabled', user, currentUser);
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    updateUserWith({
      allCommentingDisabled: !user.allCommentingDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const handleDisableMessaging = useCallback(() => {
    if (!user) return;
    const newNotes = createModNoteForPermission('conversationsDisabled', user, currentUser);
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    updateUserWith({
      conversationsDisabled: !user.conversationsDisabled,
      sunshineNotes: newNotes,
    });
  }, [user, currentUser, updateUserWith, dispatch]);

  const handleDisableVoting = useCallback(() => {
    // TODO: Implement voting permission toggle
    // eslint-disable-next-line no-console
    console.log('Toggle voting permissions - not yet implemented');
  }, []);

  return {
    handleDisablePosting,
    handleDisableCommenting,
    handleDisableMessaging,
    handleDisableVoting,
  };
}

