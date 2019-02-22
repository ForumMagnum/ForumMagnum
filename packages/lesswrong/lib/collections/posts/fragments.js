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
    question
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
  }
`);

registerFragment(`
  fragment PostsPage on Post {
    ...PostsDetails

    # Content & Revisions
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



// Same as PostsPage just optional arguments to the content field
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
  fragment PostsList on Post {
    ...PostsBase
    ...PostsAuthors

    contents {
      htmlHighlight
      wordCount
    }
    feed {
      ...RSSFeedMinimumInfo
    }
  }
`);

registerFragment(`
  fragment SequencesPostNavigationLink on Post {
    _id
    title
    url
    slug
    canonicalCollectionSlug
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