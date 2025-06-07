import { gql } from "@/lib/crud/wrapGql";

export const AdvisorRequestsDefaultFragment = gql(`
  fragment AdvisorRequestsDefaultFragment on AdvisorRequest {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    interestedInMetaculus
    jobAds
  }
`);

export const ArbitalCachesDefaultFragment = gql(`
  fragment ArbitalCachesDefaultFragment on ArbitalCaches {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const ArbitalTagContentRelsDefaultFragment = gql(`
  fragment ArbitalTagContentRelsDefaultFragment on ArbitalTagContentRel {
    _id
    schemaVersion
    createdAt
    legacyData
    parentDocumentId
    childDocumentId
    parentCollectionName
    childCollectionName
    type
    level
    isStrong
  }
`);

export const AutomatedContentEvaluationsDefaultFragment = gql(`
  fragment AutomatedContentEvaluationsDefaultFragment on AutomatedContentEvaluation {
    _id
    createdAt
    revisionId
    score
    aiChoice
    aiReasoning
    aiCoT
  }
`);

export const BansDefaultFragment = gql(`
  fragment BansDefaultFragment on Ban {
    _id
    schemaVersion
    createdAt
    legacyData
    expirationDate
    userId
    ip
    reason
    comment
    properties
  }
`);

export const BookmarksDefaultFragment = gql(`
  fragment BookmarksDefaultFragment on Bookmark {
    _id
    createdAt
    documentId
    collectionName
    userId
    lastUpdated
    active
  }
`);

export const BooksDefaultFragment = gql(`
  fragment BooksDefaultFragment on Book {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    postedAt
    title
    subtitle
    tocTitle
    collectionId
    number
    postIds
    sequenceIds
    displaySequencesAsGrid
    hideProgressBar
    showChapters
  }
`);

export const ChaptersDefaultFragment = gql(`
  fragment ChaptersDefaultFragment on Chapter {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    title
    subtitle
    number
    sequenceId
    postIds
  }
`);

export const CkEditorUserSessionsDefaultFragment = gql(`
  fragment CkEditorUserSessionsDefaultFragment on CkEditorUserSession {
    _id
    schemaVersion
    createdAt
    legacyData
    documentId
    userId
    endedAt
    endedBy
  }
`);

export const ClientIdsDefaultFragment = gql(`
  fragment ClientIdsDefaultFragment on ClientId {
    _id
    schemaVersion
    createdAt
    legacyData
    clientId
    firstSeenReferrer
    firstSeenLandingPage
    userIds
    invalidated
    lastSeenAt
    timesSeen
  }
`);

export const CollectionsDefaultFragment = gql(`
  fragment CollectionsDefaultFragment on Collection {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    userId
    title
    slug
    gridImageId
    firstPageLink
    hideStartReadingButton
    noindex
  }
`);

export const CommentModeratorActionsDefaultFragment = gql(`
  fragment CommentModeratorActionsDefaultFragment on CommentModeratorAction {
    _id
    schemaVersion
    createdAt
    legacyData
    commentId
    type
    endedAt
  }
`);

export const CommentsDefaultFragment = gql(`
  fragment CommentsDefaultFragment on Comment {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    pingbacks
    parentCommentId
    topLevelCommentId
    postedAt
    lastEditedAt
    author
    postId
    tagId
    forumEventId
    forumEventMetadata
    tagCommentType
    subforumStickyPriority
    userId
    userIP
    userAgent
    referrer
    authorIsUnreviewed
    answer
    parentAnswerId
    directChildrenCount
    descendentCount
    shortform
    shortformFrontpage
    nominatedForReview
    reviewingForReview
    lastSubthreadActivity
    postVersion
    promoted
    promotedByUserId
    promotedAt
    hideKarma
    legacy
    legacyId
    legacyPoll
    legacyParentId
    draft
    retracted
    deleted
    deletedPublic
    deletedReason
    deletedDate
    deletedByUserId
    spam
    repliesBlockedUntil
    needsReview
    reviewedByUserId
    hideAuthor
    moderatorHat
    hideModeratorHat
    isPinnedOnProfile
    title
    relevantTagIds
    debateResponse
    rejected
    modGPTAnalysis
    modGPTRecommendation
    rejectedReason
    rejectedByUserId
    af
    suggestForAlignmentUserIds
    reviewForAlignmentUserId
    afDate
    moveToAlignmentUserId
    agentFoundationsId
    originalDialogueId
    voteCount
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    afVoteCount
  }
`);

export const ConversationsDefaultFragment = gql(`
  fragment ConversationsDefaultFragment on Conversation {
    _id
    schemaVersion
    createdAt
    legacyData
    title
    participantIds
    latestActivity
    af
    messageCount
    moderator
    archivedByIds
  }
`);

export const CronHistoriesDefaultFragment = gql(`
  fragment CronHistoriesDefaultFragment on CronHistory {
    _id
    intendedAt
    name
    startedAt
    finishedAt
    result
  }
`);

export const CurationEmailsDefaultFragment = gql(`
  fragment CurationEmailsDefaultFragment on CurationEmail {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    postId
  }
`);

export const CurationNoticesDefaultFragment = gql(`
  fragment CurationNoticesDefaultFragment on CurationNotice {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    userId
    commentId
    postId
    deleted
  }
`);

export const DatabaseMetadataDefaultFragment = gql(`
  fragment DatabaseMetadataDefaultFragment on DatabaseMetadata {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const DebouncerEventsDefaultFragment = gql(`
  fragment DebouncerEventsDefaultFragment on DebouncerEvents {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const DialogueChecksDefaultFragment = gql(`
  fragment DialogueChecksDefaultFragment on DialogueCheck {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    targetUserId
    checked
    checkedAt
    hideInRecommendations
  }
`);

export const DialogueMatchPreferencesDefaultFragment = gql(`
  fragment DialogueMatchPreferencesDefaultFragment on DialogueMatchPreference {
    _id
    schemaVersion
    createdAt
    legacyData
    dialogueCheckId
    topicPreferences
    topicNotes
    syncPreference
    asyncPreference
    formatNotes
    calendlyLink
    generatedDialogueId
    deleted
  }
`);

export const DigestPostsDefaultFragment = gql(`
  fragment DigestPostsDefaultFragment on DigestPost {
    _id
    schemaVersion
    createdAt
    legacyData
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`);

export const DigestsDefaultFragment = gql(`
  fragment DigestsDefaultFragment on Digest {
    _id
    schemaVersion
    createdAt
    legacyData
    num
    startDate
    endDate
    publishedDate
    onsiteImageId
    onsitePrimaryColor
  }
`);

export const ElectionCandidatesDefaultFragment = gql(`
  fragment ElectionCandidatesDefaultFragment on ElectionCandidate {
    _id
    schemaVersion
    createdAt
    legacyData
    electionName
    name
    logoSrc
    href
    fundraiserLink
    gwwcLink
    gwwcId
    description
    userId
    postCount
    tagId
    isElectionFundraiser
    amountRaised
    targetAmount
    voteCount
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    afVoteCount
  }
`);

export const ElectionVotesDefaultFragment = gql(`
  fragment ElectionVotesDefaultFragment on ElectionVote {
    _id
    schemaVersion
    createdAt
    legacyData
    electionName
    userId
    compareState
    vote
    submittedAt
    submissionComments
    userExplanation
    userOtherComments
  }
`);

export const ElicitQuestionPredictionsDefaultFragment = gql(`
  fragment ElicitQuestionPredictionsDefaultFragment on ElicitQuestionPrediction {
    _id
    prediction
    createdAt
    notes
    userId
    sourceUrl
    sourceId
    binaryQuestionId
    isDeleted
  }
`);

export const ElicitQuestionsDefaultFragment = gql(`
  fragment ElicitQuestionsDefaultFragment on ElicitQuestion {
    _id
    schemaVersion
    createdAt
    legacyData
    title
    notes
    resolution
    resolvesBy
  }
`);

export const EmailTokensDefaultFragment = gql(`
  fragment EmailTokensDefaultFragment on EmailTokens {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const FeaturedResourcesDefaultFragment = gql(`
  fragment FeaturedResourcesDefaultFragment on FeaturedResource {
    _id
    schemaVersion
    createdAt
    legacyData
    title
    body
    ctaText
    ctaUrl
    expiresAt
  }
`);

export const FieldChangesDefaultFragment = gql(`
  fragment FieldChangesDefaultFragment on FieldChange {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    changeGroup
    documentId
    fieldName
    oldValue
    newValue
  }
`);

export const ForumEventsDefaultFragment = gql(`
  fragment ForumEventsDefaultFragment on ForumEvent {
    _id
    schemaVersion
    createdAt
    legacyData
    frontpageDescription_latest
    frontpageDescriptionMobile_latest
    postPageDescription_latest
    title
    startDate
    endDate
    darkColor
    lightColor
    bannerTextColor
    contrastColor
    tagId
    postId
    commentId
    bannerImageId
    includesPoll
    isGlobal
    eventFormat
    pollQuestion_latest
    pollAgreeWording
    pollDisagreeWording
    maxStickersPerUser
    customComponent
    commentPrompt
    publicData
  }
`);

export const GardenCodesDefaultFragment = gql(`
  fragment GardenCodesDefaultFragment on GardenCode {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    pingbacks
    slug
    code
    title
    userId
    startTime
    endTime
    fbLink
    type
    hidden
    deleted
    afOnly
  }
`);

export const GoogleServiceAccountSessionsDefaultFragment = gql(`
  fragment GoogleServiceAccountSessionsDefaultFragment on GoogleServiceAccountSession {
    _id
    schemaVersion
    createdAt
    legacyData
    email
    estimatedExpiry
    active
    revoked
  }
`);

export const ImagesDefaultFragment = gql(`
  fragment ImagesDefaultFragment on Images {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const JargonTermsDefaultFragment = gql(`
  fragment JargonTermsDefaultFragment on JargonTerm {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    postId
    term
    approved
    deleted
    altTerms
  }
`);

export const LWEventsDefaultFragment = gql(`
  fragment LWEventsDefaultFragment on LWEvent {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    name
    documentId
    important
    properties
    intercom
  }
`);

export const LegacyDataDefaultFragment = gql(`
  fragment LegacyDataDefaultFragment on LegacyData {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const LlmConversationsDefaultFragment = gql(`
  fragment LlmConversationsDefaultFragment on LlmConversation {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    title
    model
    systemPrompt
    deleted
  }
`);

export const LlmMessagesDefaultFragment = gql(`
  fragment LlmMessagesDefaultFragment on LlmMessage {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    conversationId
    role
    content
  }
`);

export const LocalgroupsDefaultFragment = gql(`
  fragment LocalgroupsDefaultFragment on Localgroup {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    name
    nameInAnotherLanguage
    organizerIds
    lastActivity
    types
    categories
    isOnline
    mongoLocation
    googleLocation
    location
    contactInfo
    facebookLink
    facebookPageLink
    meetupLink
    slackLink
    website
    bannerImageId
    inactive
    deleted
  }
`);

export const ManifoldProbabilitiesCachesDefaultFragment = gql(`
  fragment ManifoldProbabilitiesCachesDefaultFragment on ManifoldProbabilitiesCache {
    _id
    schemaVersion
    createdAt
    legacyData
    marketId
    probability
    isResolved
    year
    lastUpdated
    url
  }
`);

export const MessagesDefaultFragment = gql(`
  fragment MessagesDefaultFragment on Message {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    userId
    conversationId
    noEmail
  }
`);

export const MigrationsDefaultFragment = gql(`
  fragment MigrationsDefaultFragment on Migration {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const ModerationTemplatesDefaultFragment = gql(`
  fragment ModerationTemplatesDefaultFragment on ModerationTemplate {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    name
    collectionName
    order
    deleted
  }
`);

export const ModeratorActionsDefaultFragment = gql(`
  fragment ModeratorActionsDefaultFragment on ModeratorAction {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    type
    endedAt
  }
`);

export const MultiDocumentsDefaultFragment = gql(`
  fragment MultiDocumentsDefaultFragment on MultiDocument {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    pingbacks
    slug
    oldSlugs
    title
    preview
    tabTitle
    tabSubtitle
    userId
    parentDocumentId
    collectionName
    fieldName
    index
    contributionStats
    htmlWithContributorAnnotations
    deleted
    voteCount
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    afVoteCount
  }
`);

export const NotificationsDefaultFragment = gql(`
  fragment NotificationsDefaultFragment on Notification {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    documentId
    documentType
    extraData
    link
    title
    message
    type
    deleted
    viewed
    emailed
    waitingForBatch
  }
`);

export const PageCacheDefaultFragment = gql(`
  fragment PageCacheDefaultFragment on PageCacheEntry {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const PetrovDayActionsDefaultFragment = gql(`
  fragment PetrovDayActionsDefaultFragment on PetrovDayAction {
    _id
    schemaVersion
    createdAt
    legacyData
    actionType
    data
    userId
  }
`);

export const PetrovDayLaunchsDefaultFragment = gql(`
  fragment PetrovDayLaunchsDefaultFragment on PetrovDayLaunch {
    _id
    schemaVersion
    createdAt
    legacyData
    launchCode
    hashedLaunchCode
    userId
  }
`);

export const PodcastEpisodesDefaultFragment = gql(`
  fragment PodcastEpisodesDefaultFragment on PodcastEpisode {
    _id
    schemaVersion
    createdAt
    legacyData
    podcastId
    title
    episodeLink
    externalEpisodeId
  }
`);

export const PodcastsDefaultFragment = gql(`
  fragment PodcastsDefaultFragment on Podcast {
    _id
    schemaVersion
    createdAt
    legacyData
    title
    applePodcastLink
    spotifyPodcastLink
  }
`);

export const PostRecommendationsDefaultFragment = gql(`
  fragment PostRecommendationsDefaultFragment on PostRecommendation {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    clientId
    postId
    strategyName
    strategySettings
    recommendationCount
    lastRecommendedAt
    clickedAt
  }
`);

export const PostRelationsDefaultFragment = gql(`
  fragment PostRelationsDefaultFragment on PostRelation {
    _id
    schemaVersion
    createdAt
    legacyData
    type
    sourcePostId
    targetPostId
    order
  }
`);

export const PostsDefaultFragment = gql(`
  fragment PostsDefaultFragment on Post {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    pingbacks
    moderationGuidelines_latest
    customHighlight_latest
    slug
    postedAt
    modifiedAt
    url
    postCategory
    title
    viewCount
    lastCommentedAt
    clickCount
    deletedDraft
    status
    isFuture
    sticky
    stickyPriority
    userIP
    userAgent
    referrer
    author
    userId
    question
    authorIsUnreviewed
    readTimeMinutesOverride
    submitToFrontpage
    hiddenRelatedQuestion
    originalPostRelationSourceId
    shortform
    canonicalSource
    nominationCount2018
    nominationCount2019
    reviewCount2018
    reviewCount2019
    reviewCount
    reviewVoteCount
    positiveReviewVoteCount
    manifoldReviewMarketId
    reviewVoteScoreAF
    reviewVotesAF
    reviewVoteScoreHighKarma
    reviewVotesHighKarma
    reviewVoteScoreAllKarma
    reviewVotesAllKarma
    finalReviewVoteScoreHighKarma
    finalReviewVotesHighKarma
    finalReviewVoteScoreAllKarma
    finalReviewVotesAllKarma
    finalReviewVoteScoreAF
    finalReviewVotesAF
    lastCommentPromotedAt
    tagRelevance
    noIndex
    rsvps
    activateRSVPs
    nextDayReminderSent
    onlyVisibleToLoggedIn
    onlyVisibleToEstablishedAccounts
    hideFromRecentDiscussions
    votingSystem
    podcastEpisodeId
    forceAllowType3Audio
    legacy
    legacyId
    legacySpam
    feedId
    feedLink
    curatedDate
    metaDate
    suggestForCuratedUserIds
    frontpageDate
    autoFrontpage
    collectionTitle
    hasCoauthorPermission
    socialPreviewImageId
    socialPreviewImageAutoUrl
    canonicalSequenceId
    canonicalCollectionSlug
    canonicalBookId
    canonicalNextPostSlug
    canonicalPrevPostSlug
    unlisted
    disableRecommendation
    defaultRecommendation
    hideFromPopularComments
    draft
    wasEverUndrafted
    meta
    hideFrontpageComments
    maxBaseScore
    scoreExceeded2Date
    scoreExceeded30Date
    scoreExceeded45Date
    scoreExceeded75Date
    scoreExceeded125Date
    scoreExceeded200Date
    bannedUserIds
    commentsLocked
    commentsLockedToAccountsCreatedAfter
    organizerIds
    groupId
    eventType
    isEvent
    reviewedByUserId
    reviewForCuratedUserId
    startTime
    localStartTime
    endTime
    localEndTime
    eventRegistrationLink
    joinEventLink
    onlineEvent
    globalEvent
    mongoLocation
    googleLocation
    location
    contactInfo
    facebookLink
    meetupLink
    website
    eventImageId
    types
    metaSticky
    sharingSettings
    shareWithUsers
    linkSharingKey
    linkSharingKeyUsedBy
    commentSortOrder
    hideAuthor
    sideCommentVisibility
    disableSidenotes
    moderationStyle
    ignoreRateLimits
    hideCommentKarma
    commentCount
    topLevelCommentCount
    debate
    collabEditorDialogue
    mostRecentPublishedDialogueResponseDate
    rejected
    rejectedReason
    rejectedByUserId
    subforumTagId
    af
    afDate
    afCommentCount
    afLastCommentedAt
    afSticky
    suggestForAlignmentUserIds
    reviewForAlignmentUserId
    agentFoundationsId
    swrCachingEnabled
    generateDraftJargon
    voteCount
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    afVoteCount
  }
`);

export const RSSFeedsDefaultFragment = gql(`
  fragment RSSFeedsDefaultFragment on RSSFeed {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    ownedByUser
    displayFullContent
    nickname
    url
    status
    rawFeed
    setCanonicalUrl
    importAsDraft
  }
`);

export const ReadStatusesDefaultFragment = gql(`
  fragment ReadStatusesDefaultFragment on ReadStatus {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const RecommendationsCachesDefaultFragment = gql(`
  fragment RecommendationsCachesDefaultFragment on RecommendationsCache {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    postId
    source
    scenario
    attributionId
    ttlMs
  }
`);

export const ReportsDefaultFragment = gql(`
  fragment ReportsDefaultFragment on Report {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    reportedUserId
    commentId
    postId
    link
    claimedUserId
    description
    closedAt
    markedAsSpam
    reportedAsSpam
  }
`);

export const ReviewVotesDefaultFragment = gql(`
  fragment ReviewVotesDefaultFragment on ReviewVote {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    postId
    qualitativeScore
    quadraticScore
    comment
    year
    dummy
    reactions
  }
`);

export const ReviewWinnerArtsDefaultFragment = gql(`
  fragment ReviewWinnerArtsDefaultFragment on ReviewWinnerArt {
    _id
    schemaVersion
    createdAt
    legacyData
    postId
    splashArtImagePrompt
    splashArtImageUrl
  }
`);

export const ReviewWinnersDefaultFragment = gql(`
  fragment ReviewWinnersDefaultFragment on ReviewWinner {
    _id
    schemaVersion
    createdAt
    legacyData
    postId
    reviewYear
    category
    curatedOrder
    reviewRanking
    isAI
  }
`);

export const RevisionsDefaultFragment = gql(`
  fragment RevisionsDefaultFragment on Revision {
    _id
    schemaVersion
    createdAt
    legacyData
    documentId
    collectionName
    fieldName
    editedAt
    updateType
    version
    commitMessage
    userId
    draft
    html
    wordCount
    changeMetrics
    googleDocMetadata
    skipAttributions
    voteCount
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    afVoteCount
  }
`);

export const SequencesDefaultFragment = gql(`
  fragment SequencesDefaultFragment on Sequence {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    lastUpdated
    userId
    title
    bannerImageId
    gridImageId
    hideFromAuthorPage
    draft
    isDeleted
    curatedOrder
    userProfileOrder
    canonicalCollectionSlug
    hidden
    noindex
    af
  }
`);

export const SessionsDefaultFragment = gql(`
  fragment SessionsDefaultFragment on Session {
    _id
    session
    expires
    lastModified
  }
`);

export const SideCommentCachesDefaultFragment = gql(`
  fragment SideCommentCachesDefaultFragment on SideCommentCache {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const SplashArtCoordinatesDefaultFragment = gql(`
  fragment SplashArtCoordinatesDefaultFragment on SplashArtCoordinate {
    _id
    schemaVersion
    createdAt
    legacyData
    reviewWinnerArtId
    leftXPct
    leftYPct
    leftHeightPct
    leftWidthPct
    leftFlipped
    middleXPct
    middleYPct
    middleHeightPct
    middleWidthPct
    middleFlipped
    rightXPct
    rightYPct
    rightHeightPct
    rightWidthPct
    rightFlipped
  }
`);

export const SpotlightsDefaultFragment = gql(`
  fragment SpotlightsDefaultFragment on Spotlight {
    _id
    schemaVersion
    createdAt
    legacyData
    description_latest
    documentId
    documentType
    position
    duration
    customTitle
    customSubtitle
    subtitleUrl
    headerTitle
    headerTitleLeftColor
    headerTitleRightColor
    lastPromotedAt
    spotlightSplashImageUrl
    draft
    deletedDraft
    showAuthor
    imageFade
    imageFadeColor
    spotlightImageId
    spotlightDarkImageId
  }
`);

export const SubscriptionsDefaultFragment = gql(`
  fragment SubscriptionsDefaultFragment on Subscription {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    state
    documentId
    collectionName
    deleted
    type
  }
`);

export const SurveyQuestionsDefaultFragment = gql(`
  fragment SurveyQuestionsDefaultFragment on SurveyQuestion {
    _id
    schemaVersion
    createdAt
    legacyData
    surveyId
    question
    format
    order
  }
`);

export const SurveyResponsesDefaultFragment = gql(`
  fragment SurveyResponsesDefaultFragment on SurveyResponse {
    _id
    schemaVersion
    createdAt
    legacyData
    surveyId
    surveyScheduleId
    userId
    clientId
    response
  }
`);

export const SurveySchedulesDefaultFragment = gql(`
  fragment SurveySchedulesDefaultFragment on SurveySchedule {
    _id
    schemaVersion
    createdAt
    legacyData
    surveyId
    name
    impressionsLimit
    maxVisitorPercentage
    minKarma
    maxKarma
    target
    startDate
    endDate
    deactivated
    clientIds
  }
`);

export const SurveysDefaultFragment = gql(`
  fragment SurveysDefaultFragment on Survey {
    _id
    schemaVersion
    createdAt
    legacyData
    name
  }
`);

export const TagFlagsDefaultFragment = gql(`
  fragment TagFlagsDefaultFragment on TagFlag {
    _id
    schemaVersion
    createdAt
    legacyData
    contents_latest
    slug
    name
    deleted
    order
  }
`);

export const TagRelsDefaultFragment = gql(`
  fragment TagRelsDefaultFragment on TagRel {
    _id
    schemaVersion
    createdAt
    legacyData
    tagId
    postId
    deleted
    userId
    backfilled
    voteCount
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    afVoteCount
  }
`);

export const TagsDefaultFragment = gql(`
  fragment TagsDefaultFragment on Tag {
    _id
    schemaVersion
    createdAt
    legacyData
    description_latest
    pingbacks
    subforumWelcomeText_latest
    moderationGuidelines_latest
    slug
    oldSlugs
    name
    shortName
    subtitle
    core
    isPostType
    suggestedAsFilter
    defaultOrder
    descriptionTruncationCount
    postCount
    userId
    adminOnly
    canEditUserIds
    charsAdded
    charsRemoved
    deleted
    lastCommentedAt
    lastSubforumCommentAt
    needsReview
    reviewedByUserId
    wikiGrade
    wikiOnly
    bannerImageId
    squareImageId
    tagFlagsIds
    lesswrongWikiImportRevision
    lesswrongWikiImportSlug
    lesswrongWikiImportCompleted
    htmlWithContributorAnnotations
    contributionStats
    introSequenceId
    postsDefaultSortOrder
    canVoteOnRels
    isSubforum
    subforumModeratorIds
    subforumIntroPostId
    parentTagId
    subTagIds
    autoTagModel
    autoTagPrompt
    noindex
    isPlaceholderPage
    coreTagId
    forceAllowType3Audio
    voteCount
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    afVoteCount
  }
`);

export const TweetsDefaultFragment = gql(`
  fragment TweetsDefaultFragment on Tweet {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const TypingIndicatorsDefaultFragment = gql(`
  fragment TypingIndicatorsDefaultFragment on TypingIndicator {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    documentId
    lastUpdated
  }
`);

export const UltraFeedEventsDefaultFragment = gql(`
  fragment UltraFeedEventsDefaultFragment on UltraFeedEvent {
    _id
    createdAt
    documentId
    collectionName
    eventType
    userId
    event
    feedItemId
  }
`);

export const UserActivitiesDefaultFragment = gql(`
  fragment UserActivitiesDefaultFragment on UserActivity {
    _id
    schemaVersion
    createdAt
    legacyData
  }
`);

export const UserEAGDetailsDefaultFragment = gql(`
  fragment UserEAGDetailsDefaultFragment on UserEAGDetail {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    careerStage
    countryOrRegion
    nearestCity
    willingnessToRelocate
    experiencedIn
    interestedIn
    lastUpdated
  }
`);

export const UserJobAdsDefaultFragment = gql(`
  fragment UserJobAdsDefaultFragment on UserJobAd {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    jobName
    adState
    reminderSetAt
    lastUpdated
  }
`);

export const UserMostValuablePostsDefaultFragment = gql(`
  fragment UserMostValuablePostsDefaultFragment on UserMostValuablePost {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    postId
    deleted
  }
`);

export const UserRateLimitsDefaultFragment = gql(`
  fragment UserRateLimitsDefaultFragment on UserRateLimit {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    type
    intervalUnit
    intervalLength
    actionsPerInterval
    endedAt
  }
`);

export const UserTagRelsDefaultFragment = gql(`
  fragment UserTagRelsDefaultFragment on UserTagRel {
    _id
    schemaVersion
    createdAt
    legacyData
    tagId
    userId
    subforumShowUnreadInSidebar
    subforumEmailNotifications
    subforumHideIntroPost
  }
`);

export const UsersDefaultFragment = gql(`
  fragment UsersDefaultFragment on User {
    _id
    schemaVersion
    createdAt
    legacyData
    moderationGuidelines_latest
    howOthersCanHelpMe_latest
    howICanHelpOthers_latest
    slug
    oldSlugs
    biography_latest
    username
    emails
    isAdmin
    profile
    services
    displayName
    previousDisplayName
    email
    noindex
    groups
    lwWikiImport
    theme
    lastUsedTimezone
    whenConfirmationEmailSent
    legacy
    commentSorting
    sortDraftsBy
    reactPaletteStyle
    noKibitz
    showHideKarmaOption
    showPostAuthorCard
    hideIntercom
    markDownPostEditor
    hideElicitPredictions
    hideAFNonMemberInitialWarning
    noSingleLineComments
    noCollapseCommentsPosts
    noCollapseCommentsFrontpage
    hideCommunitySection
    showCommunityInRecentDiscussion
    hidePostsRecommendations
    petrovOptOut
    optedOutOfSurveys
    postGlossariesPinned
    generateJargonForDrafts
    generateJargonForPublishedPosts
    acceptedTos
    hideNavigationSidebar
    currentFrontpageFilter
    frontpageSelectedTab
    frontpageFilterSettings
    hideFrontpageFilterSettingsDesktop
    allPostsTimeframe
    allPostsFilter
    allPostsSorting
    allPostsShowLowKarma
    allPostsIncludeEvents
    allPostsHideCommunity
    allPostsOpenSettings
    draftsListSorting
    draftsListShowArchived
    draftsListShowShared
    lastNotificationsCheck
    karma
    goodHeartTokens
    moderationStyle
    moderatorAssistance
    collapseModerationGuidelines
    bannedUserIds
    bannedPersonalUserIds
    legacyId
    deleted
    permanentDeletionRequestedAt
    voteBanned
    nullifyVotes
    deleteContent
    banned
    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    notificationCommentsOnSubscribedPost
    notificationShortformContent
    notificationRepliesToMyComments
    notificationRepliesToSubscribedComments
    notificationSubscribedUserPost
    notificationSubscribedUserComment
    notificationPostsInGroups
    notificationSubscribedTagPost
    notificationSubscribedSequencePost
    notificationPrivateMessage
    notificationSharedWithMe
    notificationAlignmentSubmissionApproved
    notificationEventInRadius
    notificationKarmaPowersGained
    notificationRSVPs
    notificationGroupAdministration
    notificationCommentsOnDraft
    notificationPostsNominatedReview
    notificationSubforumUnread
    notificationNewMention
    notificationDialogueMessages
    notificationPublishedDialogueMessages
    notificationAddedAsCoauthor
    notificationDebateCommentsOnSubscribedPost
    notificationDebateReplies
    notificationDialogueMatch
    notificationNewDialogueChecks
    notificationYourTurnMatchForm
    hideDialogueFacilitation
    revealChecksToAdmins
    optedInToDialogueFacilitation
    showDialoguesList
    showMyDialogues
    showMatches
    showRecommendedPartners
    hideActiveDialogueUsers
    karmaChangeNotifierSettings
    karmaChangeLastOpened
    karmaChangeBatchStart
    emailSubscribedToCurated
    subscribedToDigest
    subscribedToNewsletter
    unsubscribeFromAll
    hideSubscribePoke
    hideMeetupsPoke
    hideHomeRHS
    frontpagePostCount
    sequenceCount
    sequenceDraftCount
    mongoLocation
    googleLocation
    location
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    nearbyEventsNotifications
    nearbyEventsNotificationsLocation
    nearbyEventsNotificationsMongoLocation
    nearbyEventsNotificationsRadius
    nearbyPeopleNotificationThreshold
    hideFrontpageMap
    hideTaggingProgressBar
    hideFrontpageBookAd
    hideFrontpageBook2019Ad
    hideFrontpageBook2020Ad
    sunshineNotes
    sunshineFlagged
    needsReview
    sunshineSnoozed
    snoozedUntilContentCount
    reviewedByUserId
    reviewedAt
    afKarma
    voteCount
    smallUpvoteCount
    smallDownvoteCount
    bigUpvoteCount
    bigDownvoteCount
    voteReceivedCount
    smallUpvoteReceivedCount
    smallDownvoteReceivedCount
    bigUpvoteReceivedCount
    bigDownvoteReceivedCount
    usersContactedBeforeReview
    fullName
    shortformFeedId
    viewUnreviewedComments
    beta
    reviewVotesQuadratic
    reviewVotesQuadratic2019
    reviewVotesQuadratic2020
    petrovPressedButtonDate
    petrovLaunchCodeDate
    defaultToCKEditor
    signUpReCaptchaRating
    noExpandUnreadCommentsReview
    postCount
    maxPostCount
    commentCount
    maxCommentCount
    tagRevisionCount
    abTestKey
    abTestOverrides
    walledGardenInvite
    hideWalledGardenUI
    walledGardenPortalOnboarded
    taggingDashboardCollapsed
    usernameUnset
    paymentEmail
    paymentInfo
    profileUpdatedAt
    profileImageId
    jobTitle
    organization
    careerStage
    website
    fmCrosspostUserId
    linkedinProfileURL
    facebookProfileURL
    blueskyProfileURL
    twitterProfileURL
    twitterProfileURLAdmin
    githubProfileURL
    profileTagIds
    organizerOfGroupIds
    programParticipation
    postingDisabled
    allCommentingDisabled
    commentingOnOtherUsersDisabled
    conversationsDisabled
    acknowledgedNewUserGuidelines
    subforumPreferredLayout
    hideJobAdUntil
    criticismTipsDismissed
    hideFromPeopleDirectory
    allowDatadogSessionReplay
    afPostCount
    afCommentCount
    afSequenceCount
    afSequenceDraftCount
    reviewForAlignmentForumUserId
    afApplicationText
    afSubmittedApplication
    hideSunshineSidebar
    inactiveSurveyEmailSentAt
    userSurveyEmailSentAt
    recommendationSettings
  }
`);

export const VotesDefaultFragment = gql(`
  fragment VotesDefaultFragment on Vote {
    _id
    schemaVersion
    createdAt
    legacyData
    documentId
    collectionName
    userId
    authorIds
    voteType
    extendedVoteType
    power
    afPower
    cancelled
    isUnvote
    votedAt
    documentIsAf
    silenceNotification
  }
`);
