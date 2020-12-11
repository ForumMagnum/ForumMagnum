import { membersGroup, adminsGroup } from '../../vulcan-users/permissions';
import Chapters from './collection';

const membersActions = [
  "chapters.view.own",
  "chapters.new.own",
  "chapters.edit.own",
  "chapters.remove.own",
];
membersGroup.can(membersActions);

const adminActions = [
  "chapters.view.all",
  "chapters.new.all",
  "chapters.edit.all",
  "chapters.remove.all",
];
adminsGroup.can(adminActions);

Chapters.checkAccess = async (user: DbUser|null, document: DbChapter, context: ResolverContext|null): Promise<boolean> => {
  if (!document) return false;
  // Since chapters have no userIds there is no obvious way to check for permissions.
  // We might want to check the parent sequence, but that seems too costly, so for now just be permissinve
  return true
};
