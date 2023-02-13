import { forumTypeSetting } from "../../instanceSettings";

const adminOnlyTagSlugs = ["community"];

export const shouldHideTag = (user: UsersCurrent | null, tag?: {slug: string}) => {
  if (forumTypeSetting.get() !== "EAForum" || !user) {
    return false;
  }
  if (tag && !user.isAdmin && !user.groups?.includes("sunshineRegiment")) {
    return adminOnlyTagSlugs.includes(tag.slug);
  }
  return false;
}
