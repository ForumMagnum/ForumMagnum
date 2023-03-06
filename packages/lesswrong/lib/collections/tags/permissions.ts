import { forumTypeSetting } from "../../instanceSettings";

const adminOnlyTagSlugs = ["community"];

export const shouldHideTagForVoting = (user: UsersCurrent | null, tag?: {slug: string}) => {
  if (forumTypeSetting.get() !== "EAForum") {
    return false;
  }
  if (tag && adminOnlyTagSlugs.includes(tag.slug)) {
    return user?.isAdmin || user?.groups?.includes("sunshineRegiment")
  }
  return false;
}
