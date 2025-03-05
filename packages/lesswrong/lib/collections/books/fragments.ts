export const BookPageFragment = `
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

export const BookEdit = `
  fragment BookEdit on Book {
    ...BookPageFragment
    contents {
      ...RevisionEdit
    }
  }
`
