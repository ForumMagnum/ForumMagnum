import { registerFragment } from '../../vulcan-lib';



registerFragment(`
  fragment PostsMinimumInfo on Post {
    _id
    slug
    title
    draft
    hideCommentKarma
    af
    currentUserReviewVote {
      _id
      qualitativeScore
    }
    userId
  }
`);

registerFragment(`
  fragment PostsBase on Post {
    ...PostsMinimumInfo
    
    # Core fields
    url
    postedAt
    createdAt
    sticky
    metaSticky
    stickyPriority
    status
    frontpageDate
    meta

    shareWithUsers
    sharingSettings
    
    commentCount
    voteCount
    baseScore
    extendedScore
    unlisted
    score
    lastVisitedAt
    isFuture
    isRead
    lastCommentedAt
    lastCommentPromotedAt
    canonicalCollectionSlug
    curatedDate
    commentsLocked

    # questions
    question
    hiddenRelatedQuestion
    originalPostRelationSourceId

    userId
    
    # Local Event data
    location
    googleLocation
    onlineEvent
    globalEvent
    startTime
    endTime
    localStartTime
    localEndTime
    eventRegistrationLink
    joinEventLink
    facebookLink
    meetupLink
    website
    contactInfo
    isEvent
    eventImageId
    types
    groupId

    # Review data 
    reviewedByUserId
    suggestForCuratedUserIds
    suggestForCuratedUsernames
    reviewForCuratedUserId
    authorIsUnreviewed

    # Alignment Forum
    afDate
    suggestForAlignmentUserIds
    reviewForAlignmentUserId
    afBaseScore
    afExtendedScore
    afCommentCount
    afLastCommentedAt
    afSticky
    
    hideAuthor
    moderationStyle
    submitToFrontpage
    shortform
    onlyVisibleToLoggedIn

    nominationCount2018
    reviewCount2018
    nominationCount2019
    reviewCount2019
    reviewCount
    reviewVoteCount
    positiveReviewVoteCount
    reviewVoteScoreAllKarma
    reviewVotesAllKarma
    reviewVoteScoreHighKarma
    reviewVotesHighKarma
    reviewVoteScoreAF
    reviewVotesAF

    group {
      _id
      name
      organizerIds
    }
  }
`);

registerFragment(`
  fragment PostsWithVotes on Post {
    ...PostsBase
    currentUserVote
    currentUserExtendedVote
  }
`);

registerFragment(`
  fragment PostsListWithVotes on Post {
    ...PostsList
    currentUserVote
    currentUserExtendedVote
  }
`)

registerFragment(`
  fragment PostsReviewVotingList on Post {
    ...PostsListBase
    currentUserVote
    currentUserExtendedVote
  }
`)


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
  fragment PostsListBase on Post {
    ...PostsBase
    ...PostsAuthors
    moderationGuidelines {
      _id
      html
    }
    customHighlight {
      _id
      html
    }
    lastPromotedComment {
      user {
        ...UsersMinimumInfo
      }
    }
    bestAnswer {
      ...CommentsList
    }
    tags {
      ...TagPreviewFragment
    }
  }
`);

registerFragment(`
  fragment PostsList on Post {
    ...PostsListBase
    contents {
      _id
      htmlHighlight
      wordCount
      version
    }
  }
`);

registerFragment(`
  fragment PostsListTag on Post {
    ...PostsList
    tagRelevance
    tagRel(tagId: $tagId) {
      ...WithVoteTagRel
    }
  }
`)

registerFragment(`
  fragment PostsDetails on Post {
    ...PostsListBase

    canonicalSource
    noIndex
    viewCount
    socialPreviewImageUrl
    
    # Sort settings
    commentSortOrder
    
    # Sequence navigation
    collectionTitle
    canonicalPrevPostSlug
    canonicalNextPostSlug
    canonicalSequenceId
    canonicalBookId
    canonicalSequence {
      _id
      title
    }
    canonicalBook {
      _id
      title
    }
    canonicalCollection {
      _id
      title
    }

    # Moderation stuff
    showModerationGuidelines
    bannedUserIds
    moderationStyle
    
    # Voting
    currentUserVote
    currentUserExtendedVote
    feedLink
    feed {
      ...RSSFeedMinimumInfo
    }
    sourcePostRelations {
      _id
      sourcePostId
      sourcePost {
        ...PostsList
      }
      order
    }
    targetPostRelations {
      _id
      sourcePostId
      targetPostId
      targetPost {
        ...PostsList
      }
      order
    }
    rsvps
    activateRSVPs
  }
`);

registerFragment(`
  fragment PostsExpandedHighlight on Post {
    _id
    contents {
      _id
      html
    }
  }
`);

registerFragment(`
  fragment PostsPlaintextDescription on Post {
    _id
    contents {
      _id
      plaintextDescription
    }
  }
`);

// Same as PostsPage, with added just optional arguments to the content field
// and a list of revisions
registerFragment(`
  fragment PostsRevision on Post {
    ...PostsDetails

    # Content & Revisions
    version
    contents(version: $version) {
      ...RevisionDisplay
    }
    revisions {
      ...RevisionMetadata
    }
  }
`)

registerFragment(`
  fragment PostsRevisionEdit on Post {
    ...PostsDetails

    # Content & Revisions
    version
    contents(version: $version) {
      ...RevisionEdit
    }
    revisions {
      ...RevisionMetadata
    }
  }
`)

registerFragment(`
  fragment PostsWithNavigationAndRevision on Post {
    ...PostsRevision
    ...PostSequenceNavigation
    
    tableOfContentsRevision(version: $version)
  }
`)

registerFragment(`
  fragment PostsWithNavigation on Post {
    ...PostsPage
    ...PostSequenceNavigation
    
    tableOfContents
  }
`)

// This is a union of the fields needed by PostsTopNavigation and BottomNavigation.
registerFragment(`
  fragment PostSequenceNavigation on Post {
    # Prev/next sequence navigation
    sequence(sequenceId: $sequenceId) {
      _id
      title
      draft
      userId
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
    coauthorUserIds
    moderationGuidelines {
      ...RevisionEdit
    }
    contents {
      ...RevisionEdit
    }
    customHighlight {
      ...RevisionEdit
    }
    tableOfContents
  }
`);

registerFragment(`
  fragment PostsRevisionsList on Post {
    _id
    revisions {
      ...RevisionMetadata
    }
  }
`)

registerFragment(`
  fragment PostsRecentDiscussion on Post {
    ...PostsList
    recentComments(commentsLimit: $commentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsList
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

registerFragment(`
  fragment SunshinePostsList on Post {
    ...PostsListBase

    currentUserVote
    currentUserExtendedVote

    contents {
      _id
      html
      htmlHighlight
      wordCount
      version
    }
    
    user {
      ...UsersMinimumInfo
      
      # Author moderation info
      moderationStyle
      bannedUserIds
      moderatorAssistance
      
      moderationGuidelines {
        _id
        html
      }
    }
  }
`)

registerFragment(`
  fragment WithVotePost on Post {
    __typename
    _id
    currentUserVote
    currentUserExtendedVote
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    voteCount
  }
`);

registerFragment(`
  fragment HighlightWithHash on Post {
    _id
    contents {
      htmlHighlightStartingAtHash(hash: $hash)
    }
  }
`);
