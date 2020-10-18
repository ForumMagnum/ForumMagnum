import Users from '../users/collection'

const sunshineRegimentActions = [
  'users.edit.all',
  'users.view.deleted'
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);

Users.checkAccess = async (user: DbUser|null, document: DbUser, context: ResolverContext|null): Promise<boolean> => {
  if (document && document.deleted) return Users.canDo(user, 'users.view.deleted')
  return true
};
