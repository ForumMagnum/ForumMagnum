import { registerFragment } from '../../vulcan-lib/fragments';

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
  fragment UsersCurrent on User {
    ...UsersMinimumInfo

    _id
    username
    createdAt
    isAdmin
    displayName
    email
    slug
    groups
    services
    pageUrl
    voteBanned
    banned
    isReviewed
    nullifyVotes
    hideIntercom
    hideNavigationSidebar
    currentFrontpageFilter
    frontpageFilterSettings
    allPostsTimeframe
    allPostsSorting
    allPostsFilter
    allPostsShowLowKarma
    allPostsOpenSettings
    lastNotificationsCheck
    bannedUserIds
    bannedPersonalUserIds
    bio
    moderationStyle
    moderationGuidelines {
      ...RevisionEdit
    }
    showHideKarmaOption
    markDownPostEditor
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
    unsubscribeFromAll
    emails
    whenConfirmationEmailSent
    noCollapseCommentsFrontpage
    noCollapseCommentsPosts
    noSingleLineComments
    karmaChangeNotifierSettings
    karmaChangeLastOpened
    shortformFeedId
    viewUnreviewedComments
    recommendationSettings

    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    bookmarkedPostsMetadata
    noExpandUnreadCommentsReview
    reviewVotesQuadratic
    hideTaggingProgressBar

    abTestKey
    abTestOverrides

    sortDrafts

    reenableDraftJs
    petrovPressedButtonDate
    petrovLaunchCodeDate
    ...SharedUserBooleans
  }
`);

registerFragment(`
  fragment UserBookmarks on User {
    _id
    bookmarkedPostsMetadata
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
  }
`)

registerFragment(`
  fragment UsersList on User {
    ...UsersMinimumInfo
    karma
  }
`);

registerFragment(`
  fragment SunshineUsersList on User {
    ...UsersMinimumInfo
    karma
    bio
    htmlBio
    createdAt
    email
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
    needsReview
    sunshineSnoozed
  }
`);

registerFragment(`
  fragment UsersMinimumInfo on User {
    _id
    slug
    oldSlugs
    createdAt
    username
    displayName
    fullName
    karma
    afKarma
    deleted
    groups
    isAdmin
    htmlBio
    postCount
    commentCount
    sequenceCount
    afPostCount
    afCommentCount
    beta
    spamRiskScore
  }
`);

registerFragment(`
  fragment SharedUserBooleans on User {
    walledGardenInvite
    hideWalledGardenUI
    walledGardenPortalOnboarded
    taggingDashboardCollapsed
  }
`)

registerFragment(`
  fragment UsersProfile on User {
    ...UsersMinimumInfo
    createdAt
    isAdmin
    bio
    htmlBio
    website
    groups
    postCount
    afPostCount
    frontpagePostCount
    commentCount
    sequenceCount
    afCommentCount
    sequenceCount
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
    sortDrafts
    reenableDraftJs
    ...SharedUserBooleans
  }
`);

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
    # Moderation Guidelines editor information
    moderationGuidelines {
      ...RevisionEdit
    }

    # UI Settings
    markDownPostEditor
    hideIntercom
    commentSorting
    currentFrontpageFilter
    noCollapseCommentsPosts
    noCollapseCommentsFrontpage
    noSingleLineComments

    # Emails
    email
    whenConfirmationEmailSent
    emailSubscribedToCurated
    unsubscribeFromAll

    # Moderation
    moderatorAssistance
    collapseModerationGuidelines
    bannedUserIds
    bannedPersonalUserIds
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

    hideFrontpageMap
    hideTaggingProgressBar

    deleted
  }
`)
