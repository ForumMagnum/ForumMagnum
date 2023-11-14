import type { TagCommentType } from "../collections/comments/types"

export type KarmaChangesArgs = {
  userId: string,
  startDate: Date,
  endDate: Date,
  af?: boolean,
  showNegative?: boolean,
}

export type KarmaChangeBase = {
  _id: string,
  collectionName: CollectionNameString,
  scoreChange: number,
}

export type CommentKarmaChange = KarmaChangeBase & {
  description?: string,
  postId?: string,
  tagId?: string,
  tagCommentType?: TagCommentType,

  // Not filled in by the initial query; added by a followup query in the resolver
  tagSlug?: string
}

export type PostKarmaChange = KarmaChangeBase & {
  title: string,
  slug: string,
}

export type TagRevisionKarmaChange = KarmaChangeBase & {
  tagId: string,

  // Not filled in by the initial query; added by a followup query in the resolver
  tagSlug?: string
  tagName?: string
}
