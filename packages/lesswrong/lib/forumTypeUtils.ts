import { forumTypeSetting, ForumTypeString } from "./instanceSettings"

//Partial Type adds "undefined" erroneously to T, so we need to explicitly tell TS that it can't be undefined.
type NonUndefined<T> = T extends undefined ? never : T;

type ComboForumTypeString = Exclude<ForumTypeString, "LessWrong" | "AlignmentForum"> | "LWAF";

export type ForumOptions<T> = Record<ForumTypeString, T> |
  Record<ComboForumTypeString, T> |
  (Partial<Record<ForumTypeString, T>> & {default: T}) |
  (Partial<Record<ComboForumTypeString, T>> & {default: T});

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
