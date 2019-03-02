import Users from "meteor/vulcan:users";
import bowser from 'bowser'
import { getSetting, Utils } from 'meteor/vulcan:core';
import { Votes } from '../votes';
import { Comments } from '../comments'
import { Posts } from '../posts'

Users.ownsAndInGroup = (group) => {
  return (user, document) => {
    return Users.owns(user, document) && Users.isMemberOf(user, group)
  }
}

Users.isSharedOn = (currentUser, document) => {
  return (currentUser && document.shareWithUsers && document.shareWithUsers.includes(currentUser._id))
}

Users.canEditUsersBannedUserIds = (currentUser, targetUser) => {
  if (Users.canDo(currentUser,"posts.moderate.all")) {
    return true
  }
  if (!currentUser || !targetUser) {
    return false
  }
  return !!(
    Users.canDo(currentUser,"posts.moderate.own") &&
    targetUser.moderationStyle
  )
}

Users.canModeratePost = (user, post) => {
  if (Users.canDo(user,"posts.moderate.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    (
      Users.canDo(user,"posts.moderate.own") &&
      Users.owns(user, post) &&
      ((post.moderationGuidelines && post.moderationGuidelines.html) || post.moderationStyle)
    )
    ||
    (
      Users.canDo(user, "posts.moderate.own.personal") &&
      Users.owns(user, post) &&
      ((post.moderationGuidelines && post.moderationGuidelines.html) || post.moderationStyle) &&
      !post.frontpageDate
    )
  )
}

Users.canCommentLock = (user, post) => {
  if (Users.canDo(user,"posts.commentLock.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    Users.canDo(user,"posts.commentLock.own") &&
    Users.owns(user, post)
  )
}

Users.userIsBannedFromPost = (user, post) => {
  if (!post) return false;
  const postAuthor = post.user || Users.findOne(post.userId)
  return !!(
    post.bannedUserIds &&
    post.bannedUserIds.includes(user._id) &&
    Users.owns(postAuthor, post)
  )
}

Users.userIsBannedFromAllPosts = (user, post) => {
  const postAuthor = post.user || Users.findOne(post.userId)
  return !!(
    postAuthor &&
    postAuthor.bannedUserIds &&
    postAuthor.bannedUserIds.includes(user._id) &&
    Users.canDo(postAuthor, 'posts.moderate.own') &&
    Users.owns(postAuthor, post)
  )
}

Users.userIsBannedFromAllPersonalPosts = (user, post) => {
  const postAuthor = post.user || Users.findOne(post.userId)
  return !!(
    postAuthor &&
    postAuthor.bannedPersonalUserIds &&
    postAuthor.bannedPersonalUserIds.includes(user._id) &&
    Users.canDo(postAuthor, 'posts.moderate.own.personal') &&
    Users.owns(postAuthor, post)
  )
}

Users.isAllowedToComment = (user, post) => {
  if (!user) {
    return false
  }

  if (!post) {
    return true
  }

  if (Users.userIsBannedFromPost(user, post)) {
    return false
  }

  if (Users.userIsBannedFromAllPosts(user, post)) {
    return false
  }

  if (Users.userIsBannedFromAllPersonalPosts(user, post) && !post.frontpageDate) {
    return false
  }

  if (post.commentsLocked) {
    return false
  }

  if (getSetting('AlignmentForum', false)) {
    if (!Users.canDo(user, 'comments.alignment.new')) {
      return Users.owns(user, post) && Users.canDo(user, 'votes.alignment')
    }
  }

  return true
}

Users.blockedCommentingReason = (user, post) => {
  if (!user) {
    return "Can't recognize user"
  }

  if (Users.userIsBannedFromPost(user, post)) {
    return "This post's author has blocked you from commenting."
  }

  if (getSetting('AlignmentForum', false)) {
    if (!Users.canDo(user, 'comments.alignment.new')) {
      return "You must be approved by an admin to comment on Alignment Forum"
    }
  }
  if (Users.userIsBannedFromAllPosts(user, post)) {
    return "This post's author has blocked you from commenting."
  }

  if (Users.userIsBannedFromAllPersonalPosts(user, post)) {
    return "This post's author has blocked you from commenting on any of their personal blog posts."
  }

  if (post.commentsLocked) {
    return "Comments on this post are disabled."
  }
  return "You cannot comment at this time"
}

// Return true if the user's account has at least one verified email address.
Users.emailAddressIsVerified = (user) => {
  if (!user || !user.emails)
    return false;
  for (let email of user.emails) {
    if (email && email.verified)
      return true;
  }
  return false;
};

// Replaces Users.getProfileUrl from the vulcan-users package.
Users.getProfileUrl = (user, isAbsolute=false) => {
  if (!user) return "";
  
  if (user.slug) {
    return Users.getProfileUrlFromSlug(user.slug, isAbsolute);
  } else {
    return "";
  }
}

Users.getProfileUrlFromSlug = (userSlug, isAbsolute=false) => {
  if (!userSlug) return "";
  
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  return `${prefix}/users/${userSlug}`;
}



const clientRequiresMarkdown = () => {
  if (Meteor.isClient &&
      window &&
      window.navigator &&
      window.navigator.userAgent) {

      return (bowser.mobile || bowser.tablet)
  }
  return false
}

Users.useMarkdownCommentEditor = (user) => {
  if (clientRequiresMarkdown()) {
    return true
  }
  return user && user.markDownCommentEditor
}

Users.useMarkdownPostEditor = (user) => {
  if (clientRequiresMarkdown()) {
    return true
  }
  return user && user.markDownPostEditor
}

Users.canEdit = (currentUser, user) => {
  return Users.owns(currentUser, user) || Users.canDo(currentUser, 'users.edit.all')
}



// Return the current user's location, as a latitude-longitude pair, plus
// boolean fields `loading` and `known`. If `known` is false, the lat/lng are
// invalid placeholders. If `loading` is true, then `known` is false, but the
// state might be updated with a location later.
//
// If the user is logged in, the location specified in their account settings
// is used first. If the user is not logged in, then no location is available
// for server-side rendering, but we can try to get a location client-side
// using the browser geolocation API. (This won't necessarily work, since not
// all browsers and devices support it, and it requires user permission.)
Users.getLocation = (currentUser) => {
  const placeholderLat = 37.871853;
  const placeholderLng = -122.258423;

  const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]
  if (currentUserLat && currentUserLng) {
    // First return a location from the user profile, if set
    return {lat: currentUserLat, lng: currentUserLng, loading: false, known: true}
  } else if (Meteor.isServer) {
    // If there's no location in the user profile, we may still be able to get
    // a location from the browser--but not in SSR.
    return {lat: placeholderLat, lng:placeholderLng, loading: true, known: false};
  } else {
    // If we're on the browser, try to get a location using the browser
    // geolocation API. This is not always available.
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined'
        && navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        if(position && position.coords) {
          const navigatorLat = position.coords.latitude
          const navigatorLng = position.coords.longitude
          return {lat: navigatorLat, lng: navigatorLng, loading: false, known: true}
        }
      });
    }

    return {lat: placeholderLat, lng:placeholderLng, loading: false, known: false};
  }
}

// utility function for checking how much karma a user is supposed to have
Users.getAggregateKarma = async (user) => {
  const posts = Posts.find({userId:user._id}).fetch().map(post=>post._id)
  const comments = Comments.find({userId:user._id}).fetch().map(comment=>comment._id)
  const documentIds = [...posts, ...comments]

  return await Votes.rawCollection().aggregate([
    {$match: {
      documentId: {$in:documentIds},
      userId: {$ne: user._id},
      cancelled: false
    }},
    {$group: { _id: null, totalPower: { $sum: '$power' }}},
  ]).toArray()[0].totalPower;
}

Users.getPostCount = (user) => {
  if (getSetting('AlignmentForum')) {
    return user.afPostCount;
  } else {
    return user.postCount;
  }
}

Users.getCommentCount = (user) => {
  if (getSetting('AlignmentForum')) {
    return user.afCommentCount;
  } else {
    return user.commentCount;
  }
}