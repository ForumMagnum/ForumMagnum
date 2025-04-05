import { frag } from "@/lib/fragments/fragmentWrapper";
import { PostsListWithVotes } from "../posts/fragments"

export const ChaptersFragment = () => frag`
  fragment ChaptersFragment on Chapter {
    _id
    createdAt
    title
    subtitle
    contents {
      ...RevisionDisplay
    }
    number
    sequenceId
    postIds
    posts {
      ${PostsListWithVotes}
    }
  }
`

export const ChaptersEdit = () => frag`
  fragment ChaptersEdit on Chapter {
    ${ChaptersFragment}
    contents {
      ...RevisionEdit
    }
  }
`
