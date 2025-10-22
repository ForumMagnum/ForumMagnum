import { ForumSelectFunction, forumTypeSetting, forumSelect } from "@/lib/forumTypeUtils";
import { ForumTypeString } from "@/lib/instanceSettings";
import { isBookUI, isFriendlyUI } from "@/themes/forumTheme";

export const useForumType = (): {
  isAF: boolean,
  isLW: boolean,
  isLWorAF: boolean,
  isEAForum: boolean,
  forumType: ForumTypeString,
  forumSelect: ForumSelectFunction
  isFriendlyUI: boolean,
  isBookUI: boolean,
} => {
  const forumType = forumTypeSetting.get();
  return {
    forumType,
    forumSelect,
    isLW: forumType==="LessWrong",
    isAF: forumType==="AlignmentForum",
    isLWorAF: forumType==="LessWrong" || forumType==="AlignmentForum",
    isEAForum: forumType==="EAForum",
    isFriendlyUI: isFriendlyUI(),
    isBookUI: isBookUI(),
  };
}
