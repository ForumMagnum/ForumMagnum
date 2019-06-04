import Users from 'meteor/vulcan:users'

const sunshineRegimentActions = [
  'users.edit.all',
  'users.view.deleted'
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);

const betaTesterActions = [
  // Note: if an action should be available to admins as an 'early beta test' without being accessible to other beta users yet, it should say 'beta.adminOnly'. Admins will automatically pass this check because they automatically pass everything.
  'beta.all',
];
Users.groups.betaTesters.can(betaTesterActions);

Users.checkAccess = (user, document) => {
  if (document && document.deleted) return Users.canDo(user, 'users.view.deleted')
  return true
};
