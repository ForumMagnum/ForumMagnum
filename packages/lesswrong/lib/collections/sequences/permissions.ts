import { membersGroup, adminsGroup, userCanDo, userOwns } from '../../vulcan-users/permissions';
import { Sequences } from './collection';

const membersActions = [
  'sequences.edit.own',
  'sequences.new.own',
  'sequences.remove.own',
  'chapters.new.own',
  'chapters.remote.own',
  'chapters.edit.own',
];
membersGroup.can(membersActions);

const adminActions= [
  'sequences.edit.all',
  'sequences.view.all',
  'sequences.new.all'
]
adminsGroup.can(adminActions);

export const SHOW_NEW_SEQUENCE_KARMA_THRESHOLD = 100;

Sequences.checkAccess = async (user, document) => {
  if (!document) {
    return false;
  }
  
  // If it isn't a draft and isn't deleted, it's public
  if (!document.draft && !document.isDeleted) {
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
