import bowser from 'bowser';
import { isClient, isServer } from '../../executionEnvironment';
import { userHasCkEditor } from "../../betas";
import { forumTypeSetting } from "../../instanceSettings";
import { Utils } from '../../vulcan-lib';
import { Comments } from '../comments';
import { Posts } from '../posts';
import Users, { UserLocation } from "../users/collection";
import { Votes } from '../votes';

/**
 * @summary Get a user's display name (not unique, can take special characters and spaces)
 * @param {Object} user
 */
Users.getDisplayName = (user: UsersMinimumInfo|DbUser|null): string => {
  if (!user) {
    return "";
  } else {
    return forumTypeSetting.get() === 'AlignmentForum' ? 
      (user.fullName || user.displayName) :
      (user.displayName || Users.getUserName(user)) || ""
  }
};

Users.ownsAndInGroup = (group: string) => {
  return (user: DbUser, document: HasUserIdType): boolean => {
    return Users.owns(user, document) && Users.isMemberOf(user, group)
  }
}

Users.isSharedOn = (currentUser: DbUser|UsersMinimumInfo|null, document: PostsBase): boolean => {
  if (!currentUser) return false;
  return document.shareWithUsers && document.shareWithUsers.includes(currentUser._id)
}

Users.canCollaborate = (currentUser: UsersCurrent|null, document: PostsBase): boolean => {
  return userHasCkEditor(currentUser) && Users.isSharedOn(currentUser, document)
}

Users.canEditUsersBannedUserIds = (currentUser: DbUser|null, targetUser: DbUser): boolean => {
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

const postHasModerationGuidelines = post => {
  // Because of a bug in Vulcan that doesn't adequately deal with nested fields
  // in document validation, we check for originalContents instead of html here,
  // which causes some problems with empty strings, but should overall be fine
  return post.moderationGuidelines?.originalContents || post.moderationStyle
}

Users.canModeratePost = (user: UsersMinimumInfo|DbUser|null, post: PostsBase|DbPost|null): boolean => {
  if (Users.canDo(user,"posts.moderate.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  // Users who can moderate their personal posts can moderate any post that
  // meets all of the following:
  //  1) they own
  //  2) has moderation guidelins
  //  3) is not on the frontpage
  if (
    Users.canDo(user, "posts.moderate.own.personal") &&
    Users.owns(user, post) &&
    postHasModerationGuidelines(post) &&
    !post.frontpageDate
  ) {
    return true
  }
  // Users who can moderate all of their own posts (even those on the frontpage)
  // can moderate any post that meets all of the following:
  //  1) they own
  //  2) has moderation guidelines
  // We have now checked all the possible conditions for posting, if they fail
  // this, check they cannot moderate this post
  return !!(
    Users.canDo(user,"posts.moderate.own") &&
    Users.owns(user, post) &&
    postHasModerationGuidelines(post)
  )
}

Users.canModerateComment = (user: UsersMinimumInfo|DbUser|null, post: PostsBase|DbPost|null , comment: CommentsList|DbComment) => {
  if (!user || !post || !comment) return false
  if (Users.canModeratePost(user, post)) return true 
  if (Users.owns(user, comment) && !comment.directChildrenCount) return true 
  return false
}

Users.canCommentLock = (user: UsersCurrent|DbUser|null, post: PostsBase|DbPost): boolean => {
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

const getUserFromPost = (post: PostsBase|DbPost): UsersMinimumInfo|DbUser => {
  // @ts-ignore Hackily handling the dual cases of "a fragment with a post subfragment" and "a DbPost with a postId"
  return post.user || Users.findOne(post.userId);
}

Users.userIsBannedFromPost = (user: UsersMinimumInfo|DbUser, post: PostsDetails|DbPost): boolean => {
  if (!post) return false;
  const postAuthor = getUserFromPost(post);
  return !!(
    post.bannedUserIds?.includes(user._id) &&
    Users.owns(postAuthor, post)
  )
}

Users.userIsBannedFromAllPosts = (user: UsersCurrent|DbUser, post: PostsBase|DbPost): boolean => {
  const postAuthor = getUserFromPost(post);
  return !!(
    // @ts-ignore FIXME: Not enforcing that the fragment includes bannedUserIds
    postAuthor?.bannedUserIds?.includes(user._id) &&
    Users.canDo(postAuthor, 'posts.moderate.own') &&
    Users.owns(postAuthor, post)
  )
}

Users.userIsBannedFromAllPersonalPosts = (user: UsersCurrent|DbUser, post: PostsBase|DbPost): boolean => {
  const postAuthor = getUserFromPost(post);
  return !!(
    // @ts-ignore FIXME: Not enforcing that the fragment includes bannedPersonalUserIds
    postAuthor?.bannedPersonalUserIds?.includes(user._id) &&
    Users.canDo(postAuthor, 'posts.moderate.own.personal') &&
    Users.owns(postAuthor, post)
  )
}

Users.isAllowedToComment = (user: UsersCurrent|DbUser|null, post: PostsDetails|DbPost): boolean => {
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

  if (forumTypeSetting.get() === 'AlignmentForum') {
    if (!Users.canDo(user, 'comments.alignment.new')) {
      return Users.owns(user, post) && Users.canDo(user, 'votes.alignment')
    }
  }

  return true
}

Users.blockedCommentingReason = (user: UsersCurrent|DbUser|null, post: PostsDetails|DbPost): string => {
  if (!user) {
    return "Can't recognize user"
  }

  if (Users.userIsBannedFromPost(user, post)) {
    return "This post's author has blocked you from commenting."
  }

  if (forumTypeSetting.get() === 'AlignmentForum') {
    if (!Users.canDo(user, 'comments.alignment.new')) {
      return "You must be approved by an admin to comment on the AI Alignment Forum"
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
Users.emailAddressIsVerified = (user: UsersCurrent|DbUser|null): boolean => {
  if (!user || !user.emails)
    return false;
  for (let email of user.emails) {
    if (email && email.verified)
      return true;
  }
  return false;
};

// Replaces Users.getProfileUrl from the vulcan-users package.
Users.getProfileUrl = (user: DbUser|UsersMinimumInfo|null, isAbsolute=false): string => {
  if (!user) return "";
  
  if (user.slug) {
    return Users.getProfileUrlFromSlug(user.slug, isAbsolute);
  } else {
    return "";
  }
}

Users.getProfileUrlFromSlug = (userSlug: string, isAbsolute=false): string => {
  if (!userSlug) return "";
  
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  return `${prefix}/users/${userSlug}`;
}



const clientRequiresMarkdown = (): boolean => {
  if (isClient &&
      window &&
      window.navigator &&
      window.navigator.userAgent) {

      return (bowser.mobile || bowser.tablet)
  }
  return false
}

Users.useMarkdownPostEditor = (user: UsersCurrent|null): boolean => {
  if (clientRequiresMarkdown()) {
    return true
  }
  if (!user) {
    return false;
  }
  return user.markDownPostEditor
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
Users.getLocation = (currentUser: UsersCurrent|null): UserLocation => {
  const placeholderLat = 37.871853;
  const placeholderLng = -122.258423;

  const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]
  if (currentUserLat && currentUserLng) {
    // First return a location from the user profile, if set
    return {lat: currentUserLat, lng: currentUserLng, loading: false, known: true}
  } else if (isServer) {
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
Users.getAggregateKarma = async (user: DbUser): Promise<number> => {
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

Users.getPostCount = (user: UsersMinimumInfo|DbUser): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return user.afPostCount;
  } else {
    return user.postCount;
  }
}

Users.getCommentCount = (user: UsersMinimumInfo|DbUser): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return user.afCommentCount;
  } else {
    return user.commentCount;
  }
}
