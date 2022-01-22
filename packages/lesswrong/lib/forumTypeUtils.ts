import { forumTypeSetting, ForumTypeString } from "./instanceSettings"

//Partial Type adds "undefined" erroneously to T, so we need to explicitly tell TS that it can't be undefined.
type NonUndefined<T> = T extends undefined ? never : T;

export type ForumOptions<T> = Record<ForumTypeString, T> |
  (Partial<Record<ForumTypeString, T>> & {default: T})

export function forumSelect<T>(forumOptions: ForumOptions<T>): NonUndefined<T> {
  const forumType = forumTypeSetting.get()
  if (forumType in forumOptions) {
    return forumOptions[forumType] as NonUndefined<T> // The default branch ensures T always exists
  }
  // @ts-ignore - if we get here, our type definition guarantees that there's a default set
  return forumOptions.default
}
