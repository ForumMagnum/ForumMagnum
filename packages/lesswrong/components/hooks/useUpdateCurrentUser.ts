import { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useUpdate } from '../../lib/crud/withUpdate';
import { hookToHoc } from '../../lib/hocUtils';

export function useUpdateCurrentUser(): (data: Partial<MakeFieldsNullable<DbUser>>)=>Promise<void> {
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;
  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  
  return useCallback(async (data: Partial<MakeFieldsNullable<DbUser>>): Promise<void> => {
    if (currentUserId) {
      await updateUser({
        selector: {_id: currentUserId},
        data,
      });
    }
  }, [updateUser, currentUserId]);
}

export interface WithUpdateCurrentUserProps {
  updateCurrentUser: (data: Partial<MakeFieldsNullable<DbUser>>)=>Promise<void>
}

export const withUpdateCurrentUser = hookToHoc(() => ({updateCurrentUser: useUpdateCurrentUser()}));
