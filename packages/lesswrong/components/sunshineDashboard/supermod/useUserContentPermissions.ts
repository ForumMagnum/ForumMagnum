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

export function useUserContentPermissions(
  user: SunshineUsersList | null,
  dispatch: React.ActionDispatch<[action: InboxAction]>
) {
  const currentUser = useCurrentUser();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  const getModSignatureWithNote = useCallback(
    (note: string) => getSignatureWithNote(currentUser?.displayName ?? 'Unknown', note),
    [currentUser?.displayName]
  );

  const handleDisablePosting = useCallback(() => {
    if (!user) return;
    const abled = user.postingDisabled ? 'enabled' : 'disabled';
    const notes = user.sunshineNotes || '';
    const newNotes = getModSignatureWithNote(`publishing posts ${abled}`) + notes;
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          postingDisabled: !user.postingDisabled,
          sunshineNotes: newNotes,
        },
      },
    });
  }, [user, getModSignatureWithNote, updateUser, dispatch]);

  const handleDisableCommenting = useCallback(() => {
    if (!user) return;
    const abled = user.allCommentingDisabled ? 'enabled' : 'disabled';
    const notes = user.sunshineNotes || '';
    const newNotes = getModSignatureWithNote(`all commenting ${abled}`) + notes;
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          allCommentingDisabled: !user.allCommentingDisabled,
          sunshineNotes: newNotes,
        },
      },
    });
  }, [user, getModSignatureWithNote, updateUser, dispatch]);

  const handleDisableMessaging = useCallback(() => {
    if (!user) return;
    const abled = user.conversationsDisabled ? 'enabled' : 'disabled';
    const notes = user.sunshineNotes || '';
    const newNotes = getModSignatureWithNote(`messaging ${abled}`) + notes;
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: user._id, sunshineNotes: newNotes });
    
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          conversationsDisabled: !user.conversationsDisabled,
          sunshineNotes: newNotes,
        },
      },
    });
  }, [user, getModSignatureWithNote, updateUser, dispatch]);

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

