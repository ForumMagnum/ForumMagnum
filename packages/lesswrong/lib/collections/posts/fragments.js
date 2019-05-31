import { registerFragment } from 'meteor/vulcan:core';



registerFragment(`
  fragment PostsBase on Post {
    # Core fields
    _id
    title
    url
    slug
    postedAt
    createdAt
    sticky
    metaSticky
    status
    frontpageDate
    meta
    draft
    deletedDraft
    viewCount
    clickCount
    
    commentCount
    voteCount
    baseScore
    unlisted
    score
    feedId
    feedLink
    lastVisitedAt
    lastCommentedAt
    canonicalCollectionSlug
    curatedDate
    commentsLocked

    # questions
    question
    hiddenRelatedQuestion

    # vulcan:users
    userId
    
    # Local Event data
    groupId
    location
    googleLocation
    mongoLocation
    startTime
    endTime
    facebookLink
    website
    contactInfo
    isEvent
    types

    # Review data 
    reviewedByUserId
    suggestForCuratedUserIds
    suggestForCuratedUsernames
    reviewForCuratedUserId
    authorIsUnreviewed

    # Alignment Forum
    af
    afDate
    suggestForAlignmentUserIds
    reviewForAlignmentUserId
    afBaseScore
    afCommentCount
    afLastCommentedAt
    afSticky
    
    isFuture
    hideAuthor
    moderationStyle
    submitToFrontpage
  }
`);

registerFragment(`
  fragment PostsAuthors on Post {
    user {
      ...UsersMinimumInfo
      
      # Author moderation info
      moderationStyle
      bannedUserIds
      moderatorAssistance
    }
    coauthors {
      ...UsersMinimumInfo
    }
  }
`);

registerFragment(`
  fragment PostsDetails on Post {
    ...PostsBase
    ...PostsAuthors

    # ToC
    tableOfContents

    # Sort settings
    commentSortOrder
    
    # Sequence navigation
    collectionTitle
    canonicalPrevPostSlug
    canonicalNextPostSlug
    canonicalCollectionSlug
    canonicalSequenceId
    canonicalBookId
    canonicalSequence {
      title
    }
    canonicalBook {
      title
    }
    canonicalCollection {
      title
    }

    # Moderation stuff
    showModerationGuidelines
    moderationGuidelines {
      version
      html
    }
    bannedUserIds
    hideAuthor
    moderationStyle
    
    # Voting
    voteCount
    currentUserVotes{
      ...VoteFragment
    }
    feed {
      ...RSSFeedMinimumInfo
    }
    sourcePostRelations {
      _id
      sourcePostId
      sourcePost {
        ...PostsBase
        ...PostsAuthors
      }
      order
    }
    targetPostRelations {
      _id
      sourcePostId
      targetPostId
      targetPost {
        ...PostsBase
        ...PostsAuthors
      }
      order
    }
  }
`);

// Same as PostsPage, with added just optional arguments to the content field
registerFragment(`
  fragment PostsRevision on Post {
    ...PostsDetails

    # Content & Revisions
    version
    contents(version: $version) {
      ...RevisionDisplay
    }
  }
`)

registerFragment(`
  fragment PostsWithNavigation on Post {
    ...PostsRevision
    ...PostSequenceNavigation
  }
`)

// This is a union of the fields needed by PostsTopNavigation and BottomNavigation.
registerFragment(`
  fragment PostSequenceNavigation on Post {
    # Prev/next sequence navigation
    sequence(sequenceId: $sequenceId) {
      _id
      title
    }
    prevPost(sequenceId: $sequenceId) {
      _id
      title
      slug
      commentCount
      baseScore
      sequence(sequenceId: $sequenceId) {
        _id
      }
    }
    nextPost(sequenceId: $sequenceId) {
      _id
      title
      slug
      commentCount
      baseScore
      sequence(sequenceId: $sequenceId) {
        _id
      }
    }
  }
`)

registerFragment(`
  fragment PostsPage on Post {
    ...PostsDetails
    version
    contents {
      ...RevisionDisplay
    }
  }
`)

registerFragment(`
  fragment PostsEdit on Post {
    ...PostsPage
    moderationGuidelines {
      ...RevisionEdit
    }
    contents {
      ...RevisionEdit
    }
  }
`);



registerFragment(`
  fragment EditModerationGuidelines on Post {
    moderationGuidelines {
      ...RevisionEdit
    },
    moderationStyle
  }
`)

registerFragment(`
  fragment PostsRevisionsList on Post {
    _id
    revisions {
      version
      editedAt
    }
  }
`)


registerFragment(`
  fragment PostsList on Post {
    ...PostsBase
    ...PostsAuthors
    originalPostRelationSourceId
    contents {
      htmlHighlight
      wordCount
    }
  }
`);

registerFragment(`
  fragment UsersBannedFromPostsModerationLog on Post {
    user {
      ...UsersMinimumInfo
    }
    title
    slug
    _id
    bannedUserIds
  }
`)