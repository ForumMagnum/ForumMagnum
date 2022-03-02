import bowser from 'bowser';
import { isClient, isServer } from '../../executionEnvironment';
import { userHasCkCollaboration } from "../../betas";
import { forumTypeSetting } from "../../instanceSettings";
import { getSiteUrl } from '../../vulcan-lib/utils';
import { mongoFind, mongoAggregate } from '../../mongoQueries';
import { userOwns, userCanDo, userIsMemberOf } from '../../vulcan-users/permissions';
import { useEffect, useState } from 'react';

// Get a user's display name (not unique, can take special characters and spaces)
export const userGetDisplayName = (user: UsersMinimumInfo|DbUser|null): string => {
  if (!user) {
    return "";
  } else {
    return forumTypeSetting.get() === 'AlignmentForum' ? 
      (user.fullName || user.displayName) :
      (user.displayName || getUserName(user)) || ""
  }
};

// Get a user's username (unique, no special characters or spaces)
export const getUserName = function(user: UsersMinimumInfo|DbUser|null): string|null {
  try {
    if (user?.username) return user.username;
  } catch (error) {
    console.log(error); // eslint-disable-line
  }
  return null;
};

export const userOwnsAndInGroup = (group: string) => {
  return (user: DbUser, document: HasUserIdType): boolean => {
    return userOwns(user, document) && userIsMemberOf(user, group)
  }
}

export const userIsSharedOn = (currentUser: DbUser|UsersMinimumInfo|null, document: PostsList|DbPost): boolean => {
  if (!currentUser) return false;
  
  // Explicitly shared?
  if (document.shareWithUsers && document.shareWithUsers.includes(currentUser._id)) {
    return !document.sharingSettings || document.sharingSettings.explicitlySharedUsersCan !== "none";
  } else {
    // If not individually shared with this user, still counts if shared if
    // link sharing is enabled
    return document.sharingSettings?.anyoneWithLinkCan && document.sharingSettings.anyoneWithLinkCan !== "none";
  }
}

export const userCanCollaborate = (currentUser: UsersCurrent|null, document: PostsList): boolean => {
  return userHasCkCollaboration(currentUser) && userIsSharedOn(currentUser, document)
}

export const userCanEditUsersBannedUserIds = (currentUser: DbUser|null, targetUser: DbUser): boolean => {
  if (userCanDo(currentUser,"posts.moderate.all")) {
    return true
  }
  if (!currentUser || !targetUser) {
    return false
  }
  return !!(
    userCanDo(currentUser,"posts.moderate.own") &&
    targetUser.moderationStyle
  )
}

const postHasModerationGuidelines = post => {
  // Because of a bug in Vulcan that doesn't adequately deal with nested fields
  // in document validation, we check for originalContents instead of html here,
  // which causes some problems with empty strings, but should overall be fine
  return post.moderationGuidelines?.originalContents || post.moderationStyle
}

export const userCanModeratePost = (user: UsersProfile|DbUser|null, post?: PostsBase|DbPost|null): boolean => {
  if (userCanDo(user,"posts.moderate.all")) {
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
    userCanDo(user, "posts.moderate.own.personal") &&
    userOwns(user, post) &&
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
    userCanDo(user,"posts.moderate.own") &&
    userOwns(user, post) &&
    postHasModerationGuidelines(post)
  )
}

export const userCanModerateComment = (user: UsersProfile|DbUser|null, post: PostsBase|DbPost|null , tag: TagBasicInfo|DbTag|null, comment: CommentsList|DbComment) => {
  if (!user || !comment) {
    return false;
  }
  if (post) {
    if (userCanModeratePost(user, post)) return true 
    if (userOwns(user, comment) && !comment.directChildrenCount) return true 
    return false
  } else if (tag) {
    if (userIsMemberOf(user, "sunshineRegiment")) {
      return true;
    } else if (userOwns(user, comment) && !comment.directChildrenCount) {
      return true 
    } else {
      return false
    }
  } else {
    return false
  }
}

export const userCanCommentLock = (user: UsersCurrent|DbUser|null, post: PostsBase|DbPost|null): boolean => {
  if (userCanDo(user,"posts.commentLock.all")) {
    return true
  }
  if (!user || !post) {
    return false
  }
  return !!(
    userCanDo(user,"posts.commentLock.own") &&
    userOwns(user, post)
  )
}

export const userIsBannedFromPost = (user: UsersMinimumInfo|DbUser, post: PostsDetails|DbPost, postAuthor: PostsAuthors_user|DbUser|null): boolean => {
  if (!post) return false;
  return !!(
    post.bannedUserIds?.includes(user._id) &&
    postAuthor && userOwns(postAuthor, post)
  )
}

export const userIsBannedFromAllPosts = (user: UsersCurrent|DbUser, post: PostsDetails|DbPost, postAuthor: PostsAuthors_user|DbUser|null): boolean => {
  return !!(
    // @ts-ignore FIXME: Not enforcing that the fragment includes bannedUserIds
    postAuthor?.bannedUserIds?.includes(user._id) &&
    // @ts-ignore FIXME: Not enforcing that the fragment includes user.groups
    userCanDo(postAuthor, 'posts.moderate.own') &&
    postAuthor && userOwns(postAuthor, post)
  )
}

export const userIsBannedFromAllPersonalPosts = (user: UsersCurrent|DbUser, post: PostsDetails|DbPost, postAuthor: PostsAuthors_user|DbUser|null): boolean => {
  return !!(
    // @ts-ignore FIXME: Not enforcing that the fragment includes bannedUserIds
    postAuthor?.bannedPersonalUserIds?.includes(user._id) &&
    // @ts-ignore FIXME: Not enforcing that the fragment includes user.groups
    userCanDo(postAuthor, 'posts.moderate.own.personal') &&
    postAuthor && userOwns(postAuthor, post)
  )
}

export const userIsAllowedToComment = (user: UsersCurrent|DbUser|null, post: PostsDetails|DbPost, postAuthor: PostsAuthors_user|DbUser|null): boolean => {
  if (!user) {
    return false
  }

  if (!post) {
    return true
  }

  if (userIsBannedFromPost(user, post, postAuthor)) {
    return false
  }

  if (userIsBannedFromAllPosts(user, post, postAuthor)) {
    return false
  }

  if (userIsBannedFromAllPersonalPosts(user, post, postAuthor) && !post.frontpageDate) {
    return false
  }

  if (post.commentsLocked) {
    return false
  }

  return true
}

export const userBlockedCommentingReason = (user: UsersCurrent|DbUser|null, post: PostsDetails|DbPost, postAuthor: PostsAuthors_user|null): string => {
  if (!user) {
    return "Can't recognize user"
  }

  if (userIsBannedFromPost(user, post, postAuthor)) {
    return "This post's author has blocked you from commenting."
  }

  if (userIsBannedFromAllPosts(user, post, postAuthor)) {
    return "This post's author has blocked you from commenting."
  }

  if (userIsBannedFromAllPersonalPosts(user, post, postAuthor)) {
    return "This post's author has blocked you from commenting on any of their personal blog posts."
  }

  if (post.commentsLocked) {
    return "Comments on this post are disabled."
  }
  return "You cannot comment at this time"
}

// Return true if the user's account has at least one verified email address.
export const userEmailAddressIsVerified = (user: UsersCurrent|DbUser|null): boolean => {
  // EA Forum does not do its own email verification
  if (forumTypeSetting.get() === 'EAForum') {
    return true
  }
  if (!user || !user.emails)
    return false;
  for (let email of user.emails) {
    if (email && email.verified)
      return true;
  }
  return false;
};

export const userHasEmailAddress = (user: UsersCurrent|DbUser|null): boolean => {
  return !!(user?.emails && user.emails.length > 0);
}

export function getUserEmail (user: UsersCurrent | DbUser): string | undefined {
  return user.email || user.emails?.[0]?.address
}

// Replaces Users.getProfileUrl from the vulcan-users package.
export const userGetProfileUrl = (user: DbUser|UsersMinimumInfo|AlgoliaUser|null, isAbsolute=false): string => {
  if (!user) return "";
  
  if (user.slug) {
    return userGetProfileUrlFromSlug(user.slug, isAbsolute);
  } else {
    return "";
  }
}

export const userGetProfileUrlFromSlug = (userSlug: string, isAbsolute=false): string => {
  if (!userSlug) return "";
  
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
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

export const userUseMarkdownPostEditor = (user: UsersCurrent|null): boolean => {
  if (clientRequiresMarkdown()) {
    return true
  }
  if (!user) {
    return false;
  }
  return user.markDownPostEditor
}

export const userCanEdit = (currentUser, user) => {
  return userOwns(currentUser, user) || userCanDo(currentUser, 'users.edit.all')
}



interface UserLocation {
  lat: number,
  lng: number,
  loading: boolean,
  known: boolean,
}

// Return the current user's location, as a latitude-longitude pair, plus the boolean field `known`.
// If `known` is false, the lat/lng are invalid placeholders.
// If the user is logged in, we try to return the location specified in their account settings.
export const userGetLocation = (currentUser: UsersCurrent|DbUser|null): {
  lat: number,
  lng: number,
  known: boolean
} => {
  const placeholderLat = 37.871853;
  const placeholderLng = -122.258423;

  const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]

  if (currentUserLat && currentUserLng) {
    return {lat: currentUserLat, lng: currentUserLng, known: true}
  }
  return {lat: placeholderLat, lng: placeholderLng, known: false}
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
export const useUserLocation = (currentUser: UsersCurrent|DbUser|null) => {
  const placeholderLat = 37.871853
  const placeholderLng = -122.258423
  
  const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]

  const [location, setLocation] = useState(() => {
    if (currentUserLat && currentUserLng) {
      // First return a location from the user profile, if set
      return {lat: currentUserLat, lng: currentUserLng, loading: false, known: true}
    } else if (isServer) {
      // If there's no location in the user profile, we may still be able to get
      // a location from the browser--but not in SSR.
      return {lat: placeholderLat, lng: placeholderLng, loading: true, known: false}
    } else {
      // If we're on the browser, we'll try to get a location using the browser
      // geolocation API. This is not always available.
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator && navigator.geolocation) {
        return {lat: placeholderLat, lng: placeholderLng, loading: true, known: false}
      }
    }
  
    return {lat: placeholderLat, lng: placeholderLng, loading: false, known: false}
  })
  
  useEffect(() => {
    // if we don't yet have a location for the user and we're on the browser,
    // try to get the browser location
    if (
      !(currentUserLat && currentUserLng) &&
      !isServer &&
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator &&
      navigator.geolocation
    ) {
      navigator.geolocation.getCurrentPosition((position) => {
        if (position && position.coords) {
          const navigatorLat = position.coords.latitude
          const navigatorLng = position.coords.longitude
          setLocation({lat: navigatorLat, lng: navigatorLng, loading: false, known: true})
        } else {
          setLocation({lat: placeholderLat, lng: placeholderLng, loading: false, known: false})
        }
      },
      (error) => {
        setLocation({lat: placeholderLat, lng: placeholderLng, loading: false, known: false})
      }
    )
    }
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  return location
}

// utility function for checking how much karma a user is supposed to have
export const userGetAggregateKarma = async (user: DbUser): Promise<number> => {
  const posts = (await mongoFind("Posts", {userId:user._id})).map(post=>post._id)
  const comments = (await mongoFind("Comments", {userId:user._id})).map(comment=>comment._id)
  const documentIds = [...posts, ...comments]

  return (await mongoAggregate("Votes", [
    {$match: {
      documentId: {$in:documentIds},
      userId: {$ne: user._id},
      cancelled: false
    }},
    {$group: { _id: null, totalPower: { $sum: '$power' }}},
  ]))[0].totalPower;
}

export const userGetPostCount = (user: UsersMinimumInfo|DbUser): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return user.afPostCount;
  } else {
    return user.postCount;
  }
}

export const userGetCommentCount = (user: UsersMinimumInfo|DbUser): number => {
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return user.afCommentCount;
  } else {
    return user.commentCount;
  }
}
