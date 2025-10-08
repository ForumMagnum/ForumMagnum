import { useCallback } from 'react';
import { useCurrentUserId } from '../common/withUser';
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useMutationNoCache } from '@/lib/crud/useMutationNoCache';
import { ApolloCache } from '@apollo/client';

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
  options?: UpdateCurrentUserOptions,
) => Promise<AnyBecauseTodo>;

type UpdateCurrentUserOptions = Omit<useMutation.MutationFunctionOptions<updateUseruseUpdateCurrentUserMutation, {
  selector: SelectorInput;
  data: UpdateUserDataInput;
}, ApolloCache>, "variables">;

export function useUpdateCurrentUser(): UpdateCurrentUserFunction {
  const currentUserId = useCurrentUserId();
  const [updateUser] = useMutation(UsersCurrentUpdateMutation);
  
  return useCallback(async (data: UpdateUserDataInput, options?: UpdateCurrentUserOptions): Promise<AnyBecauseTodo> => {
    if (currentUserId) {
      return await updateUser({
        variables: {
          selector: {_id: currentUserId},
          data,
        },
        ...options,
      });
    }
  }, [updateUser, currentUserId]);
}

export function useUpdateCurrentUserNoCache(): UpdateCurrentUserFunction {
  const currentUserId = useCurrentUserId();
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
