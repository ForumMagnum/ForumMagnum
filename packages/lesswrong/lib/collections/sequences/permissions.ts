import { membersGroup, adminsGroup } from '../../vulcan-users/permissions';

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

// Ray 5/2/2018 – is this commented out code still relevant?

// Sequences.checkAccess = (user, document) => {
//   console.log("Sequences checkAccess function: ", user, document);
//   if (!user || !document) return false;
//   return userOwns(user, document) ? userCanDo(user, 'sequences.view.own') : (userCanDo(user, `sequences.view.all`) || !document.draft)};
