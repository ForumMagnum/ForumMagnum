import { registerFragment, extendFragment } from 'meteor/vulcan:core';

extendFragment('UsersAdmin', `
  karma
`);

registerFragment(`
  fragment conversationsListFragment on Conversation {
    _id
    title
    createdAt
    latestActivity
    participantIds
    participants {
      ...UsersMinimumInfo
    }
  }
`);

registerFragment(`
  fragment newConversationFragment on Conversation {
    _id
    title
    participantIds
  }
`);

registerFragment(`
  fragment messageListFragment on Message {
    _id
    user {
      ...UsersMinimumInfo
    }
    contents {
      html
    }
    createdAt
    conversationId
  }
`);

registerFragment(`
  fragment editTitle on Conversation {
    _id
    title
  }
`);

registerFragment(`
  fragment NotificationsList on Notification {
    _id
    userId
    createdAt
    link
    message
    type
    viewed
  }
`);

extendFragment('UsersCurrent', `
  ...UsersMinimumInfo
  voteBanned
  banned
  nullifyVotes
  hideIntercom
  currentFrontpageFilter
  allPostsView
  allPostsFilter
  allPostsShowLowKarma
  allPostsOpenSettings
  lastNotificationsCheck
  subscribedItems
  groups
  bannedUserIds
  moderationStyle
  moderationGuidelines {
    ...RevisionEdit
  }
  markDownPostEditor
  commentSorting
  location
  googleLocation
  mongoLocation
  emailSubscribedToCurated
  emails
  whenConfirmationEmailSent
  noCollapseCommentsFrontpage
  noCollapseCommentsPosts
  karmaChangeNotifierSettings
  karmaChangeLastOpened
  shortformFeedId
  viewUnreviewedComments
`);

registerFragment(`
  fragment UserKarmaChanges on User {
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
      }
    }
  }
`);

registerFragment(`
  fragment RSSFeedMinimumInfo on RSSFeed {
    _id
    userId
    user {
      ...UsersMinimumInfo
    }
    createdAt
    ownedByUser
    displayFullContent
    nickname
    url
  }
`);

registerFragment(`
  fragment CommentStats on Comment {
    currentUserVotes{
      ...VoteFragment
    }
    baseScore
    score
  }
`);

registerFragment(`
  fragment DeletedCommentsMetaData on Comment {
    _id
    deleted
    deletedDate
    deletedByUser {
      _id
      displayName
    }
    deletedReason
    deletedPublic
  }
`)

registerFragment(`
  fragment DeletedCommentsModerationLog on Comment {
    ...DeletedCommentsMetaData
    user {
      ...UsersMinimumInfo
    }
    post {
      title
      slug
      _id
    }
  }
`)

registerFragment(`
  fragment UsersBannedFromUsersModerationLog on User {
    _id
    slug
    displayName
    bannedUserIds
  }
`)

registerFragment(`
  fragment SelectCommentsList on Comment {
    ...CommentsList
    post {
      title
      _id
      slug
    }
  }
`);

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
    createdAt
    email
    commentCount
    postCount
    voteCount
    smallUpvoteCount
    bigUpvoteCount
    smallDownvoteCount
    bigDownvoteCount
    banned
    reviewedByUserId
  }
`);

registerFragment(`
  fragment newRSSFeedFragment on RSSFeed {
    _id
    userId
    createdAt
    ownedByUser
    displayFullContent
    nickname
    url
    status
  }
`);



registerFragment(`
  fragment RSSFeedMutationFragment on RSSFeed {
    _id
    userId
    ownedByUser
    displayFullContent
    nickname
    url
  }
`);

registerFragment(`
  fragment newEventFragment on LWEvent {
    _id
    createdAt
    userId
    name
    important
    properties
    intercom
  }
`);

registerFragment(`
  fragment lastEventFragment on LWEvent {
    _id
    createdAt
    documentId
    userId
    name
    important
    properties
    intercom
  }
`);

registerFragment(`
  fragment commentWithContextFragment on Comment {
    # example-forum
    _id
    parentCommentId
    topLevelCommentId
    contents {
      ...RevisionDisplay
    }
    postedAt
    # vulcan:users
    userId
    user {
      ...UsersMinimumInfo
    }
    # example-forum
    # vulcan:voting
    currentUserVotes{
      ...VoteFragment
    }
    baseScore
    score
  }
`);

registerFragment(`
  fragment commentInlineFragment on Comment {
    # example-forum
    _id
    contents {
      ...RevisionDisplay
    }
    # vulcan:users
    userId
    user {
      ...UsersMinimumInfo
    }
  }
`);

registerFragment(`
  fragment UsersMinimumInfo on User {
    # vulcan:users
    _id
    slug
    createdAt
    username
    displayName
    fullName
    emailHash
    karma
    afKarma
    deleted
    groups
    htmlBio
    postCount
    commentCount
    afPostCount 
    afCommentCount
  }
`);

registerFragment(`
  fragment UsersProfile on User {
    # vulcan:users
    ...UsersMinimumInfo
    createdAt
    isAdmin
    bio
    htmlBio
    website
    groups
    # example-forum
    postCount
    afPostCount
    frontpagePostCount
    # example-forum
    commentCount
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
    mongoLocation
    shortformFeedId
    viewUnreviewedComments
    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
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

    # Emails
    email
    whenConfirmationEmailSent
    emailSubscribedToCurated

    # Moderation
    moderatorAssistance
    collapseModerationGuidelines
    bannedUserIds
    bannedPersonalUserIds

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
  }
`)

registerFragment(`
  fragment unclaimedReportsList on Report {
    _id
    userId
    user {
      _id
      displayName
      username
      slug
    }
    commentId
    comment {
      _id
      userId
      user {
        ...UsersMinimumInfo
      }
      baseScore
      contents {
        ...RevisionDisplay
      }
      postedAt
      deleted
      postId
      post {
        _id
        slug
        title
        isEvent
      }
    }
    postId
    post {
      _id
      slug
      title
      isEvent
      contents {
        ...RevisionDisplay
      }
    }
    closedAt
    createdAt
    claimedUserId
    claimedUser {
      _id
      displayName
      username
      slug
    }
    link
    description
    reportedAsSpam
    markedAsSpam
  }
`);

registerFragment(`
  fragment VoteMinimumInfo on Vote {
    _id
    voteType
  }
`);


registerFragment(`
  fragment VoteFragment on Vote {
    _id
    voteType
    power
  }
`);

registerFragment(`
  fragment WithVotePost on Post {
    __typename
    _id
    currentUserVotes{
      _id
      voteType
      power
    }
    baseScore
    score
    afBaseScore
    voteCount
  }
`);

registerFragment(`
  fragment WithVoteComment on Comment {
    __typename
    _id
    currentUserVotes{
      _id
      voteType
      power
    }
    baseScore
    score
    afBaseScore
    voteCount
  }
`);

//
// example-forum migrated fragments
//

// note: fragment used by default on the UsersProfile fragment
registerFragment(/* GraphQL */`
  fragment VotedItem on Vote {
    # vulcan:voting
    documentId
    power
    votedAt
  }
`);

registerFragment(`
  fragment RevisionDisplay on Revision {
    version
    updateType
    editedAt
    userId
    html
    wordCount
    htmlHighlight
    plaintextDescription
  }
`)



registerFragment(`
  fragment RevisionEdit on Revision {
    version
    updateType
    editedAt
    userId
    originalContents
    html
    markdown
    draftJS
    wordCount
    htmlHighlight
    plaintextDescription
  }
`)
