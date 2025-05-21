import { frag } from "@/lib/fragments/fragmentWrapper"

export const PostsMinimumInfo = () => frag`
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
`

export const PostsTopItemInfo = () => frag`
  fragment PostsTopItemInfo on Post {
    ${PostsMinimumInfo}
    ${PostsAuthors}
    isRead
    contents {
      _id
      htmlHighlight
      wordCount
      version
    }
    customHighlight {
      _id
      html
    }
    tags {
      ...TagPreviewFragment
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
`

export const PostsBase = () => frag`
  fragment PostsBase on Post {
    ${PostsMinimumInfo}
    
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
`

export const PostsWithVotes = () => frag`
  fragment PostsWithVotes on Post {
    ${PostsBase}
    currentUserVote
    currentUserExtendedVote
  }
`

export const PostsListWithVotes = () => frag`
  fragment PostsListWithVotes on Post {
    ${PostsList}
    currentUserVote
    currentUserExtendedVote
  }
`

export const PostsListWithVotesAndSequence = () => frag`
  fragment PostsListWithVotesAndSequence on Post {
    ${PostsListWithVotes}
    canonicalSequence {
      ...SequencesPageFragment
    }
  }
`

export const UltraFeedPostFragment = () => frag`
  fragment UltraFeedPostFragment on Post {
    ${PostsDetails}
    ${PostsListWithVotes}
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
`

export const PostsReviewVotingList = () => frag`
  fragment PostsReviewVotingList on Post {
    ${PostsListWithVotes}
    reviewVoteScoreAllKarma
    reviewVotesAllKarma
    reviewVoteScoreHighKarma
    reviewVotesHighKarma
    reviewVoteScoreAF
    reviewVotesAF
  }
`

export const PostsModerationGuidelines = () => frag`
  fragment PostsModerationGuidelines on Post {
    ${PostsMinimumInfo}
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
`

export const PostsAuthors = () => frag`
  fragment PostsAuthors on Post {
    user {
      ...UsersMinimumInfo
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
`

export const PostsListBase = () => frag`
  fragment PostsListBase on Post {
    ${PostsBase}
    ${PostsAuthors}
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
`

export const PostsList = () => frag`
  fragment PostsList on Post {
    ${PostsListBase}
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
  }
`

export const SunshineCurationPostsList = () => frag`
  fragment SunshineCurationPostsList on Post {
    ${PostsList}
    curationNotices {
      ...CurationNoticesFragment
    }
  }
`

export const PostsListTag = () => frag`
  fragment PostsListTag on Post {
    ${PostsList}
    tagRel(tagId: $tagId) {
      ...WithVoteTagRel
    }
  }
`

export const PostsListTagWithVotes = () => frag`
  fragment PostsListTagWithVotes on Post {
    ${PostsListWithVotes}
    tagRel(tagId: $tagId) {
      ...WithVoteTagRel
    }
  }
`

export const PostsDetails = () => frag`
  fragment PostsDetails on Post {
    ${PostsListBase}

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
        ${PostsListWithVotes}
      }
      order
    }
    targetPostRelations {
      _id
      sourcePostId
      targetPostId
      targetPost {
        ${PostsListWithVotes}
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
`

export const PostsExpandedHighlight = () => frag`
  fragment PostsExpandedHighlight on Post {
    _id
    contents {
      _id
      html
      wordCount
    }
  }
`

export const PostsPlaintextDescription = () => frag`
  fragment PostsPlaintextDescription on Post {
    _id
    contents {
      _id
      plaintextDescription
    }
  }
`

// Same as PostsPage, with added just optional arguments to the content field
// and a list of revisions
export const PostsRevision = () => frag`
  fragment PostsRevision on Post {
    ${PostsDetails}

    # Content & Revisions
    version
    contents(version: $version) {
      ...RevisionDisplay
    }
    revisions {
      ...RevisionMetadata
    }
  }
`

export const PostsRevisionEdit = () => frag`
  fragment PostsRevisionEdit on Post {
    ${PostsDetails}

    # Content & Revisions
    version
    contents(version: $version) {
      ...RevisionEdit
    }
    revisions {
      ...RevisionMetadata
    }
  }
`

export const PostsWithNavigationAndRevision = () => frag`
  fragment PostsWithNavigationAndRevision on Post {
    ${PostsRevision}
    ${PostSequenceNavigation}
    customHighlight {
      ...RevisionDisplay
    }
    
    tableOfContentsRevision(version: $version)
    reviewWinner {
      ...ReviewWinnerAll
    }
  }
`

export const PostsWithNavigation = () => frag`
  fragment PostsWithNavigation on Post {
    ${PostsPage}
    ${PostSequenceNavigation}
    
    tableOfContents
    reviewWinner {
      ...ReviewWinnerAll
    }
  }
`

// This is a union of the fields needed by PostsTopNavigation and BottomNavigation.
export const PostSequenceNavigation = () => frag`
  fragment PostSequenceNavigation on Post {
    # Prev/next sequence navigation
    sequence(sequenceId: $sequenceId) {
      ...SequencesPageFragment
    }
    prevPost(sequenceId: $sequenceId) {
      ${PostsListWithVotes}
      sequence(sequenceId: $sequenceId, prevOrNext: "prev") {
        _id
      }
    }
    nextPost(sequenceId: $sequenceId) {
      ${PostsListWithVotes}
      sequence(sequenceId: $sequenceId, prevOrNext: "next") {
        _id
      }
    }
  }
`

export const PostsPage = () => frag`
  fragment PostsPage on Post {
    ${PostsDetails}
    version
    contents {
      ...RevisionDisplay
    }
    customHighlight {
      ...RevisionDisplay
    }
    myEditorAccess
  }
`

export const PostsEdit = () => frag`
  fragment PostsEdit on Post {
    ${PostsDetails}
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
`

export const PostsEditQueryFragment = () => frag`
  fragment PostsEditQueryFragment on Post {
    ${PostsEdit}
    contents(version: $version) {
      ...RevisionEdit
    }
  }
`
export const PostsEditMutationFragment = () => frag`
  fragment PostsEditMutationFragment on Post {
    ${PostsEdit}
    contents {
      ...RevisionEdit
    }
  }
`

export const PostsRevisionsList = () => frag`
  fragment PostsRevisionsList on Post {
    _id
    revisions {
      ...RevisionMetadata
    }
  }
`

export const PostsRecentDiscussion = () => frag`
  fragment PostsRecentDiscussion on Post {
    ${PostsListWithVotes}
    recentComments(commentsLimit: $commentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsList
    }
  }
`

export const ShortformRecentDiscussion = () => frag`
  fragment ShortformRecentDiscussion on Post {
    ${PostsListWithVotes}
    recentComments(commentsLimit: $commentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsListWithTopLevelComment
    }
  }
`

export const UsersBannedFromPostsModerationLog = () => frag`
  fragment UsersBannedFromPostsModerationLog on Post {
    user {
      ...UsersMinimumInfo
    }
    title
    slug
    _id
    bannedUserIds
  }
`

export const SunshinePostsList = () => frag`
  fragment SunshinePostsList on Post {
    ${PostsListBase}

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

      automatedContentEvaluations {
        _id
        score
        sentenceScores {
          sentence
          score
        }
        aiChoice
        aiReasoning
        aiCoT
      }
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
`

export const WithVotePost = () => frag`
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
`

export const HighlightWithHash = () => frag`
  fragment HighlightWithHash on Post {
    _id
    contents {
      _id
      htmlHighlightStartingAtHash(hash: $hash)
    }
  }
`

export const PostWithDialogueMessage = () => frag`
  fragment PostWithDialogueMessage on Post {
    _id
    dialogueMessageContents(dialogueMessageId: $dialogueMessageId)
  }
`

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
export const PostSideComments = () => frag`
  fragment PostSideComments on Post {
    _id
    sideComments
    sideCommentsCache {
      ...SideCommentCacheMinimumInfo
    }
  }
`

export const PostWithGeneratedSummary = () => frag`
  fragment PostWithGeneratedSummary on Post {
    _id
    languageModelSummary
  }
`

export const PostsBestOfList = () => frag`
  fragment PostsBestOfList on Post {
    ${PostsListWithVotes}
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
`

export const PostsRSSFeed = () => frag`
  fragment PostsRSSFeed on Post {
    ${PostsPage}
    scoreExceeded2Date
    scoreExceeded30Date
    scoreExceeded45Date
    scoreExceeded75Date
    scoreExceeded125Date
    scoreExceeded200Date
    metaDate
  }
`

export const PostsOriginalContents = () => frag`
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
`

export const PostsHTML = () => frag`
  fragment PostsHTML on Post {
    _id
    contents {
      ...RevisionHTML
    }
  }
`

export const PostsForAutocomplete = () => frag`
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
`

export const PostForReviewWinnerItem = () => frag`
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
`

export const PostsTwitterAdmin = () => frag`
  fragment PostsTwitterAdmin on Post {
    ${PostsListWithVotes}
    user {
      ...UsersSocialMediaInfo
    }
    coauthors {
      ...UsersSocialMediaInfo
    }
  }
`

export const SuggestAlignmentPost = () => frag`
  fragment SuggestAlignmentPost on Post {
    ${PostsList}
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }
`
