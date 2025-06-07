import { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const UsersCurrentUpdateMutation = gql(`
  mutation updateUseruseUpdateCurrentUser($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersCurrent
      }
    }
  }
`);

export type UpdateCurrentUserFunction = (
  data: UpdateUserDataInput,
) => Promise<AnyBecauseTodo>;

export function useUpdateCurrentUser(): UpdateCurrentUserFunction {
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;
  const [updateUser] = useMutation(UsersCurrentUpdateMutation);
  
  return useCallback(async (data: UpdateUserDataInput & Partial<Pick<DbUser, 'reactPaletteStyle' | 'subforumPreferredLayout'>>): Promise<AnyBecauseTodo> => {
    if (currentUserId) {
      return await updateUser({
        variables: {
          selector: {_id: currentUserId},
          data,
        }
      });
    }
  }, [updateUser, currentUserId]);
}
