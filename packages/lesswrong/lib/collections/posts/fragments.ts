import { gql } from "@/lib/generated/gql-codegen";

export const PostsMinimumInfo = gql(`
  fragment PostsMinimumInfo on Post {
    _id
    slug
    title
    draft
    shortform
    hideCommentKarma
    af
    userId
    coauthorStatuses {
      userId
      confirmed
      requested
    }
    hasCoauthorPermission
    rejected
    debate
    collabEditorDialogue
  }
`)

export const PostsTopItemInfo = gql(`
  fragment PostsTopItemInfo on Post {
    ...PostsMinimumInfo
    ...PostsAuthors
    isRead
    contents {
      _id
      htmlHighlight
      wordCount
      version
    }
    reviewWinner {
      ...ReviewWinnerTopPostsPage
    }
    spotlight {
      ...SpotlightReviewWinner
    }
    reviews {
      ...CommentsList
    }
    finalReviewVoteScoreHighKarma
  }
`)

export const PostsBase = gql(`
  fragment PostsBase on Post {
    ...PostsMinimumInfo
    
    # Core fields
    url
    postedAt
    sticky
    metaSticky
    stickyPriority
    status
    frontpageDate
    meta
    deletedDraft
    postCategory
    tagRelevance

    shareWithUsers
    sharingSettings
    linkSharingKey

    contents_latest
    commentCount
    voteCount
    baseScore
    extendedScore
    emojiReactors
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
    manifoldReviewMarketId

    annualReviewMarketProbability
    annualReviewMarketIsResolved
    annualReviewMarketYear
    annualReviewMarketUrl

    group {
      _id
      name
      organizerIds
    }
    rsvpCounts

    podcastEpisodeId
    forceAllowType3Audio

    # deprecated
    nominationCount2019
    reviewCount2019

    votingSystem
    
    disableRecommendation
  }
`)

export const PostsWithVotes = gql(`
  fragment PostsWithVotes on Post {
    ...PostsBase
    currentUserVote
    currentUserExtendedVote
  }
`)

export const PostsListWithVotes = gql(`
  fragment PostsListWithVotes on Post {
    ...PostsList
    currentUserVote
    currentUserExtendedVote
  }
`)

export const PostsListWithVotesAndSequence = gql(`
  fragment PostsListWithVotesAndSequence on Post {
    ...PostsListWithVotes
    canonicalSequence {
      ...SequencesPageFragment
    }
  }
`)

export const UltraFeedPostFragment = gql(`
  fragment UltraFeedPostFragment on Post {
    ...PostsDetails
    ...PostsListWithVotes
    contents {
      _id
      html
      htmlHighlight
      wordCount
      plaintextDescription
      version
    }
    autoFrontpage
    votingSystem
  }
`)

export const PostsReviewVotingList = gql(`
  fragment PostsReviewVotingList on Post {
    ...PostsListWithVotes
    reviewVoteScoreAllKarma
    reviewVotesAllKarma
    reviewVoteScoreHighKarma
    reviewVotesHighKarma
    reviewVoteScoreAF
    reviewVotesAF
    currentUserReviewVote {
      _id
      qualitativeScore
      quadraticScore
    }
  }
`)

export const PostsModerationGuidelines = gql(`
  fragment PostsModerationGuidelines on Post {
    ...PostsMinimumInfo
    frontpageDate
    user {
      _id
      displayName
      moderationStyle
    }
    moderationStyle
    moderationGuidelines {
      _id
      html
      originalContents {
        type
        data
      }
    }
  }
`)

export const PostsAuthors = gql(`
  fragment PostsAuthors on Post {
    user {
      ...UsersMinimumInfo
      profileImageId
      
      # Author moderation info
      moderationStyle
      bannedUserIds
      moderatorAssistance
      groups
      banned
      allCommentingDisabled
    }
    coauthors {
      ...UsersMinimumInfo
    }
  }
`)

export const PostsListBase = gql(`
  fragment PostsListBase on Post {
    ...PostsBase
    ...PostsAuthors
    readTimeMinutes
    rejectedReason
    customHighlight {
      _id
      html
      plaintextDescription
    }
    lastPromotedComment {
      _id
      user {
        ...UsersMinimumInfo
      }
    }
    bestAnswer {
      ...CommentsList
    }
    tags {
      ...TagBasicInfo
    }
    socialPreviewData {
      _id
      imageUrl
    }

    feedId
    totalDialogueResponseCount
    unreadDebateResponseCount
    dialogTooltipPreview
    disableSidenotes
  }
`)

export const PostsList = gql(`
  fragment PostsList on Post {
    ...PostsListBase
    deletedDraft
    contents {
      _id
      htmlHighlight
      plaintextDescription
      wordCount
      version
    }
    fmCrosspost {
      isCrosspost
      hostedHere
      foreignPostId
    }
    bannedUserIds
  }
`)

export const SunshineCurationPostsList = gql(`
  fragment SunshineCurationPostsList on Post {
    ...PostsList
    curationNotices {
      ...CurationNoticesFragment
    }
  }
`)

export const PostsListTag = gql(`
  fragment PostsListTag on Post {
    ...PostsList
    tagRel(tagId: $tagId) {
      ...WithVoteTagRel
    }
  }
`)

export const PostsListTagWithVotes = gql(`
  fragment PostsListTagWithVotes on Post {
    ...PostsListWithVotes
    tagRel(tagId: $tagId) {
      ...WithVoteTagRel
    }
  }
`)

export const PostsDetails = gql(`
  fragment PostsDetails on Post {
    ...PostsListBase

    canonicalSource
    noIndex
    viewCount
    tags {
      ...TagPreviewFragment
    }
    socialPreviewData {
      _id
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
      _id
      title
      podcast {
        _id
        title
        applePodcastLink
        spotifyPodcastLink
      }
      episodeLink
      externalEpisodeId
    }

    # Moderation stuff
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
    fmCrosspost {
      isCrosspost
      hostedHere
      foreignPostId
    }

    # Jargon Terms
    glossary {
      ...JargonTermsPost
    }
  }
`)

export const PostsExpandedHighlight = gql(`
  fragment PostsExpandedHighlight on Post {
    _id
    contents {
      _id
      html
      wordCount
    }
  }
`)

export const PostsPlaintextDescription = gql(`
  fragment PostsPlaintextDescription on Post {
    _id
    contents {
      _id
      plaintextDescription
    }
  }
`)

// Same as PostsPage, with added just optional arguments to the content field
// and a list of revisions
export const PostsRevision = gql(`
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

export const PostsRevisionEdit = gql(`
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

export const PostsWithNavigationAndRevision = gql(`
  fragment PostsWithNavigationAndRevision on Post {
    ...PostsRevision
    ...PostSequenceNavigation
    customHighlight {
      ...RevisionDisplay
    }
    
    tableOfContentsRevision(version: $version)
    reviewWinner {
      ...ReviewWinnerAll
    }
  }
`)

export const PostsWithNavigation = gql(`
  fragment PostsWithNavigation on Post {
    ...PostsPage
    ...PostSequenceNavigation
    
    tableOfContents
    reviewWinner {
      ...ReviewWinnerAll
    }
  }
`)

// This is a union of the fields needed by PostsTopNavigation and BottomNavigation.
export const PostSequenceNavigation = gql(`
  fragment PostSequenceNavigation on Post {
    # Prev/next sequence navigation
    sequence(sequenceId: $sequenceId) {
      ...SequencesPageFragment
    }
    prevPost(sequenceId: $sequenceId) {
      ...PostsListWithVotes
      sequence(sequenceId: $sequenceId, prevOrNext: "prev") {
        _id
      }
    }
    nextPost(sequenceId: $sequenceId) {
      ...PostsListWithVotes
      sequence(sequenceId: $sequenceId, prevOrNext: "next") {
        _id
      }
    }
  }
`)

export const PostsPage = gql(`
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
  }
`)

export const PostsEdit = gql(`
  fragment PostsEdit on Post {
    ...PostsDetails
    ...PostSideComments
    myEditorAccess
    version
    coauthorStatuses {
      userId
      confirmed
      requested
    }
    readTimeMinutesOverride
    fmCrosspost {
      isCrosspost
      hostedHere
      foreignPostId
    }
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
    socialPreviewImageId
    socialPreview {
      imageId
      text
    }
    socialPreviewData {
      _id
      imageId
      text
    }
    user {
      ...UsersMinimumInfo
      moderationStyle
      bannedUserIds
      moderatorAssistance
    }
    usersSharedWith {
      ...UsersMinimumInfo
    }
    coauthors {
      ...UsersMinimumInfo
    }
    generateDraftJargon
  }
`)

export const PostsEditQueryFragment = gql(`
  fragment PostsEditQueryFragment on Post {
    ...PostsEdit
    contents(version: $version) {
      ...RevisionEdit
    }
  }
`)
export const PostsEditMutationFragment = gql(`
  fragment PostsEditMutationFragment on Post {
    ...PostsEdit
    contents {
      ...RevisionEdit
    }
  }
`)

export const PostsRevisionsList = gql(`
  fragment PostsRevisionsList on Post {
    _id
    revisions {
      ...RevisionMetadata
    }
  }
`)

export const PostsRecentDiscussion = gql(`
  fragment PostsRecentDiscussion on Post {
    ...PostsListWithVotes
    recentComments(commentsLimit: $commentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsList
    }
  }
`)

export const ShortformRecentDiscussion = gql(`
  fragment ShortformRecentDiscussion on Post {
    ...PostsListWithVotes
    recentComments(commentsLimit: $commentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsListWithTopLevelComment
    }
  }
`)

export const UsersBannedFromPostsModerationLog = gql(`
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

export const SunshinePostsList = gql(`
  fragment SunshinePostsList on Post {
    ...PostsListBase

    currentUserVote
    currentUserExtendedVote
    fmCrosspost {
      isCrosspost
      hostedHere
      foreignPostId
    }
    rejectedReason
    autoFrontpage

    contents {
      _id
      html
      htmlHighlight
      wordCount
      version
    }

    automatedContentEvaluations {
      ...AutomatedContentEvaluationsFragment
    }

    moderationGuidelines {
      _id
      html
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

export const WithVotePost = gql(`
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
`)

export const HighlightWithHash = gql(`
  fragment HighlightWithHash on Post {
    _id
    contents {
      _id
      htmlHighlightStartingAtHash(hash: $hash)
    }
  }
`)

export const PostWithDialogueMessage = gql(`
  fragment PostWithDialogueMessage on Post {
    _id
    dialogueMessageContents(dialogueMessageId: $dialogueMessageId)
  }
`)

/**
 * Note that the side comments cache isn't actually used by the client. We
 * include it in this fragment though as it means that it will be fetched with
 * a join by the SQL resolver which allows us to avoid a database round-trip in
 * the code resolver for `sideComments`.
 *
 * The order of the fields is very important. The cache is permission gated via
 * `sqlPostProcess` to prevent it from being sent to the client, but it needs to
 * be accessible to the code resolver for `sideComments`. GraphQL resolves the
 * fields _in the order_ that they are defined in the fragment. The cache must
 * be specified after the main field otherwise it will be removed by its
 * permission gate. (There's no sensitive data in the cache so technically this
 * isn't the end of the word, but it is a _big_ field that we don't want to
 * waste bandwidth on).
 */
export const PostSideComments = gql(`
  fragment PostSideComments on Post {
    _id
    sideComments
    sideCommentsCache {
      ...SideCommentCacheMinimumInfo
    }
  }
`)

export const PostWithGeneratedSummary = gql(`
  fragment PostWithGeneratedSummary on Post {
    _id
    languageModelSummary
  }
`)

export const PostsBestOfList = gql(`
  fragment PostsBestOfList on Post {
    ...PostsListWithVotes
    podcastEpisode {
      _id
      title
      podcast {
        _id
        title
        applePodcastLink
        spotifyPodcastLink
      }
      episodeLink
      externalEpisodeId
    }
    socialPreviewData {
      _id
      text
      imageUrl
    }
    firstVideoAttribsForPreview
  }
`)

export const PostsRSSFeed = gql(`
  fragment PostsRSSFeed on Post {
    ...PostsPage
    scoreExceeded2Date
    scoreExceeded30Date
    scoreExceeded45Date
    scoreExceeded75Date
    scoreExceeded125Date
    scoreExceeded200Date
    metaDate
  }
`)

export const PostsOriginalContents = gql(`
  fragment PostsOriginalContents on Post {
    _id
    contents {
      _id
      originalContents {
        type
        data
      }
    }
  }
`)

export const PostsHTML = gql(`
  fragment PostsHTML on Post {
    _id
    contents {
      ...RevisionHTML
    }
  }
`)

export const PostsForAutocomplete = gql(`
  fragment PostsForAutocomplete on Post {
    _id
    title
    userId
    baseScore
    extendedScore
    user {
      ...UsersMinimumInfo
    }
    contents {
      markdown
    }
  }
`)

export const PostForReviewWinnerItem = gql(`
  fragment PostForReviewWinnerItem on Post {
    _id
    spotlight {
      _id
    }
    reviewWinner {
      _id
      category
    }
  }
`)

export const PostsTwitterAdmin = gql(`
  fragment PostsTwitterAdmin on Post {
    ...PostsListWithVotes
    user {
      ...UsersSocialMediaInfo
    }
    coauthors {
      ...UsersSocialMediaInfo
    }
  }
`)

export const SuggestAlignmentPost = gql(`
  fragment SuggestAlignmentPost on Post {
    ...PostsList
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }
`)
