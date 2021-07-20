import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment UsersMinimumInfo on User {
    _id
    slug
    createdAt
    username
    displayName
    fullName
    karma
    afKarma
    deleted
    isAdmin
    htmlBio
    postCount
    commentCount
    sequenceCount
    afPostCount
    afCommentCount
    spamRiskScore
    tagRevisionCount
  }
`);

registerFragment(`
  fragment UsersProfile on User {
    ...UsersMinimumInfo
    oldSlugs
    groups
    bio
    website
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
    sortDrafts
    reenableDraftJs
    ...SunshineUsersList
    ...SharedUserBooleans
  }
`);

registerFragment(`
  fragment UsersCurrent on User {
    ...UsersProfile

    beta
    email
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
    hideElicitPredictions
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
    noCollapseCommentsFrontpage
    noCollapseCommentsPosts
    noSingleLineComments
    karmaChangeNotifierSettings
    karmaChangeLastOpened
    shortformFeedId
    viewUnreviewedComments
    recommendationSettings

    bookmarkedPostsMetadata
    bookmarkedPosts {
      ...PostsList
    }

    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    noExpandUnreadCommentsReview
    reviewVotesQuadratic
    reviewVotesQuadratic2019
    hideTaggingProgressBar
    hideFrontpageBookAd

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
  }
`)

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
    sunshineNotes
    sunshineFlagged
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
    # Moderation Guidelines editor information
    moderationGuidelines {
      ...RevisionEdit
    }

    # UI Settings
    markDownPostEditor
    hideElicitPredictions
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
    subscribedToDigest
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
    hideFrontpageBookAd

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
