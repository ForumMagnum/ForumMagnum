import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import * as _ from 'underscore';
import { constantTimeCompare } from '../../helpers';

export type CollaborativeEditingAccessLevel = "none"|"read"|"comment"|"edit";

export function strongerAccessLevel(a: CollaborativeEditingAccessLevel|null, b: CollaborativeEditingAccessLevel|null): CollaborativeEditingAccessLevel {
  if (a==="edit" || b==="edit") return "edit";
  if (a==="comment" || b==="comment") return "comment";
  if (a==="read" || b==="read") return "read";
  if (a) return a;
  if (b) return b;
  return "none";
}

export function accessLevelCan(accessLevel: CollaborativeEditingAccessLevel, operation: "read"|"comment"|"edit") {
  if (accessLevel === "edit") {
    return true;
  } else if (accessLevel === "comment") {
    return operation==="read" || operation==="comment";
  } else if (accessLevel === "read") {
    return operation==="read";
  } else if (accessLevel === "none") {
    return false;
  }
}

export function getSharingKeyFromContext(context: ResolverContext|null) {
  const key = context?.req?.query.key;
  if (typeof key === 'string') {
    return key;
  }

  return '';
}

export async function getCollaborativeEditorAccess({formType, post, user, context, useAdminPowers}: {
  formType: "new"|"edit",
  post: DbPost|null,
  user: DbUser|null,
  context: ResolverContext|null,
  
  // If true and the user is a moderator/admin, take their admin powers into
  // account. If false, return permissions as they would be given no moderator
  // powers.
  useAdminPowers: boolean,
}): Promise<CollaborativeEditingAccessLevel> {
  const canEditAsAdmin = useAdminPowers && userCanDo(user, 'posts.edit.all');
  const canEdit = post && (userOwns(user, post) || canEditAsAdmin)
  let accessLevel: CollaborativeEditingAccessLevel = "none";
  
  if (formType === "new" && user && !post) {
    accessLevel = strongerAccessLevel(accessLevel, "edit");
    return "edit";
  }
  if (!post) {
    return "none";
  }
  
  if (canEdit) {
    accessLevel = strongerAccessLevel(accessLevel, "edit");
  } 

  if (user && _.contains(post.shareWithUsers, user._id)) {
    accessLevel = strongerAccessLevel(accessLevel, post.sharingSettings?.explicitlySharedUsersCan);
  } 
  
  if (constantTimeCompare(getSharingKeyFromContext(context), post.linkSharingKey)) {
    accessLevel = strongerAccessLevel(accessLevel, post.sharingSettings?.anyoneWithLinkCan);
  }
  
  return accessLevel;
}

export interface SharingSettings {
  anyoneWithLinkCan: CollaborativeEditingAccessLevel,
  explicitlySharedUsersCan: CollaborativeEditingAccessLevel,
}
export const defaultSharingSettings: SharingSettings = {
  anyoneWithLinkCan: "none",
  explicitlySharedUsersCan: "comment",
};
