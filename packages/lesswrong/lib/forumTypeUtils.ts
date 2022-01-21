import { forumTypeSetting, ForumTypeString } from "./instanceSettings"

export type ForumOptions<T> = Record<ForumTypeString, T> |
  (Partial<Record<ForumTypeString, T>> & {default: T})

export function forumSelect<T>(forumOptions: ForumOptions<T>): T {
  const forumType = forumTypeSetting.get()
  if (forumType in forumOptions) {
    return forumOptions[forumType] as T // Won't be missing, we just checked for that
  }
  // @ts-ignore - if we get here, our type definition guarantees that there's a default set
  return forumOptions.default
}
