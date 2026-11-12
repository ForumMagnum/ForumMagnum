import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';

const AddModeratorNoteMutation = gql(`
  mutation addModeratorNote($userId: String!, $note: String!) {
    addModeratorNote(userId: $userId, note: $note) {
      ...SunshineUsersList
    }
  }
`);

/**
 * Adds a note to a user's moderator notes. The server prepends it to the stored
 * notes, so use this rather than writing a full `sunshineNotes` built from a
 * loaded copy, which would erase notes other moderators added since it loaded.
 */
export function useAddModeratorNote() {
  const [addModeratorNoteMutation] = useMutation(AddModeratorNoteMutation);

  return useCallback(async (userId: string, note: string) => {
    const { data } = await addModeratorNoteMutation({ variables: { userId, note } });
    return data?.addModeratorNote ?? null;
  }, [addModeratorNoteMutation]);
}

/** For display until the server responds; never send the result to the server. */
export function getOptimisticNotes(notes: string | null, moderatorName: string, note: string) {
  return getSignatureWithNote(moderatorName, note) + (notes ?? '');
}
