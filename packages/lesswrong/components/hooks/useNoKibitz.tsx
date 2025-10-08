import React, { useContext } from 'react';
import { useFilteredCurrentUser } from '../common/withUser';
import { DisableNoKibitzContext } from '../common/sharedContexts';

export const useNoKibitz = (user: UsersMinimumInfo|null|undefined): boolean => {
  const {disableNoKibitz} = useContext(DisableNoKibitzContext);
  return useFilteredCurrentUser(currentUser => !!(
    currentUser
    && (currentUser.noKibitz ?? false)
    && user
    && currentUser._id !== user._id  //don't nokibitz your own name
    && !disableNoKibitz
  ));
}


