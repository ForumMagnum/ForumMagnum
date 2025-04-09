import { frag } from "@/lib/fragments/fragmentWrapper";
import { PostsListWithVotes } from "../posts/fragments"

export const BookPageFragment = () => gql`
  fragment BookPageFragment on Book {
    _id
    createdAt
    title
    number
    subtitle
    tocTitle
    contents {
      ...RevisionDisplay
    }
    sequenceIds
    sequences {
      ...SequencesPageWithChaptersFragment
    }
    postIds
    posts {
      ...PostsListWithVotes
    }
    collectionId
    displaySequencesAsGrid
    hideProgressBar
    showChapters
  }
`

export const BookEdit = () => gql`
  fragment BookEdit on Book {
    ...BookPageFragment
    contents {
      ...RevisionEdit
    }
  }
`
