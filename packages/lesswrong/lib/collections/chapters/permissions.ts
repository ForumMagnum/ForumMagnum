import Chapters from './collection';

Chapters.checkAccess = async (user: DbUser|null, document: DbChapter, context: ResolverContext|null): Promise<boolean> => {
  if (!document) return false;
  // Since chapters have no userIds there is no obvious way to check for permissions.
  // We might want to check the parent sequence, but that seems too costly, so for now just be permissinve
  return true
};
