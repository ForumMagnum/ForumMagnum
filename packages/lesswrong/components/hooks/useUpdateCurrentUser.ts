import { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useUpdate } from '../../lib/crud/withUpdate';
import { hookToHoc } from '../../lib/hocUtils';

export type UpdateCurrentUserFunction = (
  data: Partial<MakeFieldsNullable<DbUser>>,
) => Promise<AnyBecauseTodo>;

export function useUpdateCurrentUser(): UpdateCurrentUserFunction {
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;
  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  
  return useCallback(async (data: Partial<MakeFieldsNullable<DbUser>>): Promise<AnyBecauseTodo> => {
    if (currentUserId) {
      return await updateUser({
        selector: {_id: currentUserId},
        data,
      });
    }
  }, [updateUser, currentUserId]);
}

export interface WithUpdateCurrentUserProps {
  updateCurrentUser: UpdateCurrentUserFunction
}

export const withUpdateCurrentUser = hookToHoc(() => ({updateCurrentUser: useUpdateCurrentUser()}));
