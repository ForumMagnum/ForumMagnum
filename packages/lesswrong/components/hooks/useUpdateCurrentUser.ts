import { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useMutationNoCache } from '@/lib/crud/useMutationNoCache';

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
  
  return useCallback(async (data: UpdateUserDataInput): Promise<AnyBecauseTodo> => {
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

export function useUpdateCurrentUserNoCache(): UpdateCurrentUserFunction {
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;
  const [updateUser] = useMutationNoCache(UsersCurrentUpdateMutation);
  
  return useCallback(async (data: UpdateUserDataInput): Promise<AnyBecauseTodo> => {
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
