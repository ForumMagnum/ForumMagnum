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
  markDownCommentEditor
  markDownPostEditor
  location
  googleLocation
  mongoLocation
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
  fragment PostsList on Post {
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
    htmlHighlight
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
    reviewedByUserId
    suggestForCuratedUserIds
    suggestForCuratedUsernames
    reviewForCuratedUserId
    af
    afBaseScore
    allVotes {
      ...VoteMinimumInfo
    }
  }
`);

registerFragment(`
  fragment EventsList on Post {
    ...PostsList
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
    ...PostsList
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
    types
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
    allVotes {
      ...VoteMinimumInfo
    }
    af
    afBaseScore
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
  fragment SunshineUsersList on User {
    ...UsersMinimumInfo
    karma
    createdAt
    email
    commentCount
    postCount
    allVotes {
      _id
      voteType
      documentId
    }
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
    karma
    afKarma
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
    frontpagePostCount
    # example-forum
    commentCount
    sequenceCount
    sequenceDraftCount
    moderationStyle
    bannedUserIds
    location
    googleLocation
    mongoLocation
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
      _id
      userId
      user {
        ...UsersMinimumInfo
      }
      body
      htmlBody
      baseScore
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
  }
`);

registerFragment(`
  fragment VoteMinimumInfo on Vote {
    _id
    voteType
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
  }
`);
