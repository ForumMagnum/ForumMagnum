import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import { Sequences } from './collection';

export const SHOW_NEW_SEQUENCE_KARMA_THRESHOLD = 100;

Sequences.checkAccess = async (user, document) => {
  if (!document || document.isDeleted) {
    return false;
  }
  
  // If it isn't a draft, it's public
  if (!document.draft) {
    return true;
  }
  
  if (!user) {
    return false;
  }
  
  if (userOwns(user, document)) {
    return true;
  } else if (userCanDo(user, `sequences.view.all`)) {
    return true;
  } else {
    return false;
  }
}
