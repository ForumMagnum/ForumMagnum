import { registerFragment, extendFragment } from 'meteor/vulcan:core';

extendFragment('UsersAdmin', `
  karma
`);

registerFragment(`
  fragment UsersMinimumInfo on User {
    # vulcan:users
    _id
    slug
    username
    displayName
    emailHash
    karma
  }
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
    createdAt
    content
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
  karma
  voteBanned
  banned
  nullifyVotes
  hideIntercom
  currentFrontpageFilter
  lastNotificationsCheck
  subscribedItems
  groups
  bannedUserIds
  moderationStyle
  markDownEditor
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
  fragment LWPostsList on Post {
    # example-forum
    _id
    title
    url
    slug
    postedAt
    createdAt
    sticky
    status
    frontpageDate
    meta
    # body # We replaced this with content
    htmlBody # We replaced this with content
    excerpt # This won't work with content
    # content # Our replacement for body
    viewCount
    clickCount
    # vulcan:users
    userId
    user {
      ...UsersMinimumInfo
    }
    # vulcan:embedly
    # example-forum
    categories {
      ...CategoriesMinimumInfo
    }
    # example-forum
    commentCount
    # vulcan:voting
    currentUserVotes{
      ...VoteFragment
    }
    baseScore
    unlisted
    score
    feedId
    feedLink
    feed {
      ...RSSFeedMinimumInfo
    }
    lastVisitedAt
    lastCommentedAt
    canonicalCollectionSlug
    curatedDate
    wordCount
    commentsLocked
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
  }
`);

registerFragment(`
  fragment EventsList on Post {
    ...LWPostsList
    location
    googleLocation
    mongoLocation
    startTime
    endTime
    facebookLink
    website
    contactInfo
    content
    types
  }
`);

registerFragment(`
  fragment LWPostsPage on Post {
    ...LWPostsList
    body
    htmlBody
    content
    draft
    canonicalPrevPostSlug
    canonicalNextPostSlug
    canonicalCollectionSlug
    canonicalSequenceId
    canonicalBookId
    bannedUserIds
    user {
      groups
      moderationStyle
      bannedUserIds
      moderationGuidelines
      moderatorAssistance
    }
    canonicalSequence {
      title
    }
    canonicalBook {
      title
    }
    canonicalCollection {
      title
    }
    collectionTitle
  }
`);

registerFragment(`
  fragment LWPostsBody on Post {
    htmlBody
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
  fragment PostUrl on Post {
    _id
    url
    slug
  }
`);

registerFragment(`
  fragment PostStats on Post {
    allVotes {
      ...VoteFragment
    }
    baseScore
    score
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
  fragment UsersBannedFromUsersModerationLog on User {
    _id
    slug
    displayName
    bannedUserIds
  }
`)

registerFragment(`
  fragment CommentsList on Comment {
    # example-forum
    _id
    postId
    parentCommentId
    topLevelCommentId
    body
    htmlBody
    content
    postedAt
    repliesBlockedUntil
    # vulcan:users
    userId
    deleted
    deletedPublic
    user {
      ...UsersMinimumInfo
    }
    # vulcan:voting
    currentUserVotes {
      ...VoteFragment
    }
    baseScore
    score
  }
`);

registerFragment(`
  fragment RecentDiscussionThreadsList on Post {
    _id
    slug
    title
    baseScore
    hideFrontpageComments
    lastCommentedAt
    commentCount
    wordCount
    excerpt
    lastVisitedAt
    user {
      ...UsersMinimumInfo
    }
  }
`);

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
    body
    htmlBody
    content
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
    body
    htmlBody
    content
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
    username
    displayName
    emailHash
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
    karma
    # example-forum
    postCount
    frontpagePostCount
    # example-forum
    commentCount
    sequenceCount
    sequenceDraftCount
    moderationStyle
    bannedUserIds
  }
`);

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
      body
    }
    postId
    post {
      title
    }
    claimedUserId
    claimedUser {
      _id
      displayName
      username
      slug
    }
    link
    description
  }
`);
