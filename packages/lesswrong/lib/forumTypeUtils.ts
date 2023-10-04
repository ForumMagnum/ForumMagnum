import capitalize from "lodash/fp/capitalize";
import { forumTypeSetting, ForumTypeString } from "./instanceSettings"
import { isFriendlyUI } from "../themes/forumTheme";

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

export class DeferredForumSelect<T> {
  constructor(private forumOptions: ForumOptions<T>) {}

  get(forumType?: ForumTypeString): NonUndefined<T> {
    return forumSelect(this.forumOptions, forumType);
  }
}

/**
 * Convert heading to sentence case in Friendly UI sites, leave as is on LW (will usually be "start case" e.g. "Set Topics").
 * In the event of edge cases (e.g. "EA Forum" -> "Ea forum"), it's probably best to do an inline forumTypeSetting check
 */
export const preferredHeadingCase = isFriendlyUI ? capitalize : (s: string) => s;
