import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment UsersMinimumInfo on User {
    _id
    slug
    createdAt
    username
    displayName
    profileImageId
    previousDisplayName
    fullName
    karma
    afKarma
    deleted
    isAdmin
    htmlBio
    jobTitle
    organization
    postCount
    commentCount
    sequenceCount
    afPostCount
    afCommentCount
    spamRiskScore
    tagRevisionCount
    reviewedByUserId
  }
`);

registerFragment(`
  fragment UsersProfile on User {
    ...UsersMinimumInfo
    oldSlugs
    groups
    jobTitle
    organization
    careerStage
    biography {
      ...RevisionDisplay
    }
    howOthersCanHelpMe {
      ...RevisionEdit
    }
    howICanHelpOthers {
      ...RevisionEdit
    }
    profileTagIds
    profileTags {
      ...TagBasicInfo
    }
    organizerOfGroupIds
    organizerOfGroups {
      ...localGroupsBase
    }
    programParticipation
    website
    linkedinProfileURL
    facebookProfileURL
    twitterProfileURL
    githubProfileURL
    frontpagePostCount
    afSequenceCount
    afSequenceDraftCount
    sequenceDraftCount
    moderationStyle
    moderationGuidelines {
      ...RevisionDisplay
    }
    bannedUserIds
    location
    googleLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    mongoLocation
    shortformFeedId
    viewUnreviewedComments
    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    petrovPressedButtonDate
    petrovOptOut
    sortDraftsBy
    ...SunshineUsersList
    ...SharedUserBooleans
    noindex
    paymentEmail
    paymentInfo
    goodHeartTokens
    postingDisabled
    allCommentingDisabled
    commentingOnOtherUsersDisabled
    conversationsDisabled
  }
`);

registerFragment(`
  fragment UsersCurrent on User {
    ...UsersProfile

    beta
    email
    services
    acceptedTos
    pageUrl
    voteBanned
    banned
    isReviewed
    nullifyVotes
    hideIntercom
    hideNavigationSidebar
    hideCommunitySection
    expandedFrontpageSections
    hidePostsRecommendations
    currentFrontpageFilter
    frontpageFilterSettings
    hideFrontpageFilterSettingsDesktop
    allPostsTimeframe
    allPostsSorting
    allPostsFilter
    allPostsShowLowKarma
    allPostsIncludeEvents
    allPostsHideCommunity
    allPostsOpenSettings
    draftsListSorting
    draftsListShowArchived
    draftsListShowShared
    lastNotificationsCheck
    bannedUserIds
    bannedPersonalUserIds
    biography {
      ...RevisionEdit
    }
    moderationStyle
    moderationGuidelines {
      ...RevisionEdit
    }
    noKibitz
    showHideKarmaOption
    markDownPostEditor
    hideElicitPredictions
    hideAFNonMemberInitialWarning
    commentSorting
    location
    googleLocation
    mongoLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    nearbyEventsNotifications
    nearbyEventsNotificationsLocation
    nearbyEventsNotificationsRadius
    nearbyPeopleNotificationThreshold
    hideFrontpageMap
    emailSubscribedToCurated
    subscribedToDigest
    unsubscribeFromAll
    emails
    whenConfirmationEmailSent
    hideSubscribePoke
    hideMeetupsPoke
    hideHomeRHS
    noCollapseCommentsFrontpage
    noCollapseCommentsPosts
    noSingleLineComments
    showCommunityInRecentDiscussion
    karmaChangeNotifierSettings
    karmaChangeLastOpened
    shortformFeedId
    viewUnreviewedComments
    recommendationSettings
    theme

    bookmarkedPostsMetadata

    hiddenPostsMetadata
    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    noExpandUnreadCommentsReview
    reviewVotesQuadratic
    reviewVotesQuadratic2019
    reviewVotesQuadratic2020
    hideTaggingProgressBar
    hideFrontpageBookAd
    hideFrontpageBook2019Ad

    abTestKey
    abTestOverrides

    sortDraftsBy
    reactPaletteStyle

    petrovPressedButtonDate
    petrovLaunchCodeDate
    petrovOptOut
    lastUsedTimezone
    ...SharedUserBooleans

    acknowledgedNewUserGuidelines
    notificationSubforumUnread
    subforumPreferredLayout
    
    experiencedIn
    interestedIn
    
    allowDatadogSessionReplay
  }
`);

/**
 * Fragment containing rate-limit information (ie, whether the user is rate limited and when
 * they're next eligible to comment). Separated from `UsersCurrent` because figuring that out can
 * involve some DB queries that we don't want to have to finish in serial before the rest of the
 * page can start loading.
 */
registerFragment(`
  fragment UsersCurrentCommentRateLimit on User {
    _id
    rateLimitNextAbleToComment(postId: $postId)
  }
`);

registerFragment(`
  fragment UsersCurrentPostRateLimit on User {
    _id
    rateLimitNextAbleToPost(eventForm: $eventForm)
  }
`);

registerFragment(`
  fragment UserBookmarkedPosts on User {
    _id
    bookmarkedPosts {
      ...PostsList
    }
  }
`);

registerFragment(`
  fragment UserKarmaChanges on User {
    _id
    karmaChanges {
      totalChange
      updateFrequency
      startDate
      endDate
      nextBatchDate
      posts {
        _id
        scoreChange
        title
        slug
      }
      comments {
        _id
        scoreChange
        description
        postId
        tagSlug
        tagCommentType
      }
      tagRevisions {
        _id
        scoreChange
        tagId
        tagSlug
        tagName
      }
    }
  }
`);

registerFragment(`
  fragment UsersBannedFromUsersModerationLog on User {
    _id
    slug
    displayName
    bannedUserIds
    bannedPersonalUserIds
  }
`)

registerFragment(`
  fragment SunshineUsersList on User {
    ...UsersMinimumInfo
    karma
    htmlBio
    website
    createdAt
    email
    emails
    commentCount
    maxCommentCount
    postCount
    maxPostCount
    voteCount
    smallUpvoteCount
    bigUpvoteCount
    smallDownvoteCount
    bigDownvoteCount
    banned
    reviewedByUserId
    reviewedAt
    signUpReCaptchaRating
    mapLocation
    needsReview
    sunshineNotes
    sunshineFlagged
    postingDisabled
    allCommentingDisabled
    commentingOnOtherUsersDisabled
    conversationsDisabled
    snoozedUntilContentCount
    voteBanned
    nullifyVotes
    deleteContent
    
    moderatorActions {
      ...ModeratorActionDisplay
    }
    usersContactedBeforeReview
    associatedClientIds {
      clientId
      firstSeenReferrer
      firstSeenLandingPage
      userIds
    }
    altAccountsDetected

    voteReceivedCount
    smallUpvoteReceivedCount
    bigUpvoteReceivedCount
    smallDownvoteReceivedCount
    bigDownvoteReceivedCount

    recentKarmaInfo
    lastNotificationsCheck
  }
`);

registerFragment(`
  fragment UserAltAccountsFragment on User {
    ...SunshineUsersList
    IPs
  }
`);

registerFragment(`
  fragment SharedUserBooleans on User {
    walledGardenInvite
    hideWalledGardenUI
    walledGardenPortalOnboarded
    taggingDashboardCollapsed
    usernameUnset
  }
`)

registerFragment(`
  fragment UsersMapEntry on User {
    ...UsersMinimumInfo
    createdAt
    isAdmin
    groups
    location
    googleLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    mongoLocation
  }
`);


registerFragment(`
  fragment UsersEdit on User {
    ...UsersProfile
    biography {
      ...RevisionEdit
    }
    # Moderation Guidelines editor information
    moderationGuidelines {
      ...RevisionEdit
    }

    # UI Settings
    markDownPostEditor
    hideElicitPredictions
    hideAFNonMemberInitialWarning
    hideIntercom
    commentSorting
    currentFrontpageFilter
    noCollapseCommentsPosts
    noCollapseCommentsFrontpage
    noSingleLineComments
    hideCommunitySection
    showCommunityInRecentDiscussion
    hidePostsRecommendations
    beta
    theme

    # Emails
    email
    whenConfirmationEmailSent
    emailSubscribedToCurated
    subscribedToDigest
    unsubscribeFromAll
    hasAuth0Id

    # Moderation
    moderatorAssistance
    collapseModerationGuidelines
    bannedUserIds
    bannedPersonalUserIds
    noKibitz
    showHideKarmaOption

    # Ban & Purge
    voteBanned
    nullifyVotes
    deleteContent
    banned

    # Name
    username
    displayName
    fullName

    # Location
    mongoLocation
    googleLocation
    location
    
    # Map Location (public)
    mapLocation
    
    # Privacy settings
    allowDatadogSessionReplay

    # Admin & Review
    reviewedByUserId

    # Alignment Forum
    reviewForAlignmentForumUserId
    groups
    afApplicationText
    afSubmittedApplication

    # Karma Settings
    karmaChangeLastOpened
    karmaChangeNotifierSettings

    notificationShortformContent
    notificationCommentsOnSubscribedPost
    notificationRepliesToMyComments
    notificationRepliesToSubscribedComments
    notificationSubscribedUserPost
    notificationSubscribedTagPost
    notificationPostsInGroups
    notificationPrivateMessage
    notificationSharedWithMe
    notificationAlignmentSubmissionApproved
    notificationEventInRadius
    notificationRSVPs
    notificationCommentsOnDraft
    notificationPostsNominatedReview
    notificationGroupAdministration
    notificationSubforumUnread
    notificationNewMention

    hideFrontpageMap
    hideTaggingProgressBar
    hideFrontpageBookAd
    hideFrontpageBook2019Ad

    deleted
  }
`)

registerFragment(`
  fragment UsersAdmin on User {
    _id
    username
    createdAt
    isAdmin
    displayName
    email
    slug
    groups
    services
    karma
  }
`);

registerFragment(`
  fragment UsersWithReviewInfo on User {
    ...UsersMinimumInfo
    reviewVoteCount
    email
  }
`)

registerFragment(`
  fragment UsersProfileEdit on User {
    _id
    slug
    jobTitle
    organization
    careerStage
    profileImageId
    biography {
      ...RevisionEdit
    }
    howOthersCanHelpMe {
      ...RevisionEdit
    }
    howICanHelpOthers {
      ...RevisionEdit
    }
    profileTagIds
    organizerOfGroupIds
    organizerOfGroups {
      ...localGroupsBase
    }
    programParticipation
    mapLocation
    website
    linkedinProfileURL
    facebookProfileURL
    twitterProfileURL
    githubProfileURL
  }
`)

registerFragment(`
  fragment UsersCrosspostInfo on User {
    _id
    username
    slug
    fmCrosspostUserId
  }
`)
