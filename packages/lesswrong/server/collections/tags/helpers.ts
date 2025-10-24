import { userCanCreateTags } from "@/lib/betas";
import { tagUserHasSufficientKarma } from "@/lib/collections/tags/helpers";

export function newTagCheck(user: DbUser | null, tag: OmitBySubtype<CreateTagDataInput, CreateRevisionDataInput> | null, context: ResolverContext): tag is CreateTagDataInput {
  if (!user || !tag) return false;
  if (user.deleted) return false;

  if (!user.isAdmin) {  // skip further checks for admins
    if (!tagUserHasSufficientKarma(user, "new", context.forumType)) return false
  }
  return userCanCreateTags(user);
}

export function editTagCheck(user: DbUser | null, tag: DbTag, context: ResolverContext) {
  if (!user) return false;
  if (user.deleted) return false;

  if (!user.isAdmin) {  // skip further checks for admins
    // If canEditUserIds is set only those users can edit the tag
    const restricted = tag && tag.canEditUserIds
    if (restricted && !tag.canEditUserIds?.includes(user._id)) return false;
    if (!restricted && !tagUserHasSufficientKarma(user, "edit", context.forumType)) return false
  }
  return userCanCreateTags(user);
}
