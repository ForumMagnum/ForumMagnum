import { registerFragment } from '../../vulcan-lib';



registerFragment(`
  fragment PostsMinimumInfo on Post {
    _id
    slug
    title
    draft
    shortform
    hideCommentKarma
    af
    currentUserReviewVote {
      _id
      qualitativeScore
      quadraticScore
    }
    userId
    coauthorStatuses
    hasCoauthorPermission
    rejected
    debate
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
    deletedDraft
    postCategory

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
    commentsLockedToAccountsCreatedAfter
    debate

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
    eventType
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
    ignoreRateLimits

    submitToFrontpage
    shortform
    onlyVisibleToLoggedIn
    onlyVisibleToEstablishedAccounts

    reviewCount
    reviewVoteCount
    positiveReviewVoteCount

    group {
      _id
      name
      organizerIds
    }

    podcastEpisodeId

    # deprecated
    nominationCount2019
    reviewCount2019

    votingSystem
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
  fragment PostsListWithVotesAndSequence on Post {
    ...PostsListWithVotes
    canonicalSequence {
      ...SequencesPageFragment
    }
  }
`)

registerFragment(`
  fragment PostsReviewVotingList on Post {
    ...PostsListWithVotes
    reviewVoteScoreAllKarma
    reviewVotesAllKarma
    reviewVoteScoreHighKarma
    reviewVotesHighKarma
    reviewVoteScoreAF
    reviewVotesAF
  }
`)


registerFragment(`
  fragment PostsAuthors on Post {
    user {
      ...UsersMinimumInfo
      biography {
        ...RevisionDisplay
      }
      profileImageId
      
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
    readTimeMinutes
    rejectedReason
    disableRecommendation
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

    unreadDebateResponseCount
    dialogTooltipPreview
  }
`);

registerFragment(`
  fragment PostsList on Post {
    ...PostsListBase
    tagRelevance
    deletedDraft
    contents {
      _id
      htmlHighlight
      wordCount
      version
    }
    fmCrosspost
  }
`);

registerFragment(`
  fragment PostsListTag on Post {
    ...PostsList
    tagRel(tagId: $tagId) {
      ...WithVoteTagRel
    }
  }
`)

registerFragment(`
  fragment PostsListTagWithVotes on Post {
    ...PostsListWithVotes
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
    socialPreviewData {
      text
      imageUrl
    }
    
    # Tags
    tagRelevance
    
    # Posts-page display options
    commentSortOrder
    sideCommentVisibility
    
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

    # Podcast
    podcastEpisode {
      title
      podcast {
        title
        applePodcastLink
        spotifyPodcastLink
      }
      episodeLink
      externalEpisodeId
    }

    # Moderation stuff
    showModerationGuidelines
    bannedUserIds
    moderationStyle
    
    # Voting
    currentUserVote
    currentUserExtendedVote
    
    # RSS metadata
    feedLink
    feed {
      ...RSSFeedMinimumInfo
    }
    
    # Related Questions
    sourcePostRelations {
      _id
      sourcePostId
      sourcePost {
        ...PostsListWithVotes
      }
      order
    }
    targetPostRelations {
      _id
      sourcePostId
      targetPostId
      targetPost {
        ...PostsListWithVotes
      }
      order
    }
    
    # Events
    rsvps
    activateRSVPs

    # Crossposting
    fmCrosspost
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
    customHighlight {
      ...RevisionDisplay
    }
    
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
      ...SequencesPageFragment
    }
    prevPost(sequenceId: $sequenceId) {
      _id
      title
      slug
      commentCount
      afCommentCount
      baseScore
      sequence(sequenceId: $sequenceId, prevOrNext: "prev") {
        _id
      }
    }
    nextPost(sequenceId: $sequenceId) {
      _id
      title
      slug
      commentCount
      afCommentCount
      baseScore
      sequence(sequenceId: $sequenceId, prevOrNext: "next") {
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
    customHighlight {
      ...RevisionDisplay
    }
    myEditorAccess
    linkSharingKey
  }
`)

registerFragment(`
  fragment PostsEdit on Post {
    ...PostsDetails
    myEditorAccess
    linkSharingKey
    version
    coauthorStatuses
    readTimeMinutesOverride
    fmCrosspost
    hideFromRecentDiscussions
    hideFromPopularComments
    moderationGuidelines {
      ...RevisionEdit
    }
    customHighlight {
      ...RevisionEdit
    }
    tableOfContents
    subforumTagId
    sideComments
    socialPreviewImageId
    socialPreview
    socialPreviewData {
      imageId
      text
    }
    criticismTipsDismissed
  }
`);

registerFragment(`
  fragment PostsEditQueryFragment on Post {
    ...PostsEdit
    contents(version: $version) {
      ...RevisionEdit
    }
  }
`);
registerFragment(`
  fragment PostsEditMutationFragment on Post {
    ...PostsEdit
    contents {
      ...RevisionEdit
    }
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
  fragment ShortformRecentDiscussion on Post {
    ...PostsList
    recentComments(commentsLimit: $commentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsListWithTopLevelComment
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
    fmCrosspost
    rejectedReason

    contents {
      _id
      html
      htmlHighlight
      wordCount
      version
    }
    
    user {
      ...UsersMinimumInfo
      biography {
        ...RevisionDisplay
      }
      profileImageId
      
      # Author moderation info
      moderationStyle
      bannedUserIds
      moderatorAssistance
      
      moderationGuidelines {
        _id
        html
      }

      needsReview
      moderatorActions {
        ...ModeratorActionDisplay
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
      _id
      htmlHighlightStartingAtHash(hash: $hash)
    }
  }
`);

registerFragment(`
  fragment PostSideComments on Post {
    _id
    sideComments
  }
`);

registerFragment(`
  fragment PostWithGeneratedSummary on Post {
    _id
    languageModelSummary
  }
`);

registerFragment(`
  fragment PostsEditCriticismTips on Post {
    _id
    criticismTipsDismissed
  }
`);
