import { isServer } from "./executionEnvironment";
import type { ForumTypeString } from "./instanceSettings"

export const forumTypeSetting: { get: () => ForumTypeString } = {
  get: () => {
    if (isServer) {
      return process.env.FORUM_TYPE as ForumTypeString | undefined ?? 'LessWrong';
    }

    const urlObj = new URL(window.location.href);
    if (urlObj.hostname.includes('alignmentforum.org')) {
      return 'AlignmentForum';
    } else if (urlObj.hostname.includes('forum.effectivealtruism.org')) {
      return 'EAForum';
    } else {
      return process.env.FORUM_TYPE as ForumTypeString | undefined ?? 'LessWrong';
    }
  }
};

export const isLW = () => forumTypeSetting.get() === "LessWrong"
export const isEAForum = () => forumTypeSetting.get() === "EAForum"
export const isAF = () => forumTypeSetting.get() === "AlignmentForum"
export const isLWorAF = () => isLW() || isAF()

//Partial Type adds "undefined" erroneously to T, so we need to explicitly tell TS that it can't be undefined.
type NonUndefined<T> = T extends undefined ? never : T;

type ComboForumTypeString = Exclude<ForumTypeString, "LessWrong" | "AlignmentForum"> | "LWAF";

export type ForumOptions<T> = Record<ForumTypeString, T> |
  Record<ComboForumTypeString, T> |
  (Partial<Record<ForumTypeString, T>> & {default: T}) |
  (Partial<Record<ComboForumTypeString, T>> & {default: T});

export type ForumSelectFunction = <T>(forumOptions: ForumOptions<T>, forumType?: ForumTypeString) => NonUndefined<T>

export function forumSelect<T>(forumOptions: ForumOptions<T>, forumType?: ForumTypeString): NonUndefined<T> {
  forumType ??= forumTypeSetting.get();
  if (forumType in forumOptions) {
    return (forumOptions as AnyBecauseTodo)[forumType] as NonUndefined<T> // The default branch ensures T always exists
  }
  if ((forumType === "LessWrong" || forumType === "AlignmentForum") && "LWAF" in forumOptions) {
    return forumOptions["LWAF"] as NonUndefined<T>
  }
  // @ts-ignore - if we get here, our type definition guarantees that there's a default set
  return forumOptions.default
}

