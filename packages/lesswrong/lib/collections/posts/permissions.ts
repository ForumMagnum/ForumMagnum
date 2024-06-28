import { Posts } from './collection'
import { postStatusLabels } from './constants'
import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import { userIsSharedOn } from '../users/helpers'
import * as _ from 'underscore';
import { userIsPostGroupOrganizer } from './helpers';
import { getSharingKeyFromContext } from './collabEditingPermissions';
import { constantTimeCompare } from '../../helpers';

// LessWrong Permissions

Posts.checkAccess = async (currentUser: DbUser|null, post: DbPost, context: ResolverContext|null, outReasonDenied: {reason?: string}): Promise<boolean> => {
  const canonicalLinkSharingKey = post.linkSharingKey;
  const unvalidatedLinkSharingKey = getSharingKeyFromContext(context);

  if (post.onlyVisibleToLoggedIn && !currentUser) {
    if (outReasonDenied)
      outReasonDenied.reason = "This post is only visible to logged-in users.";
    return false;
  }
  if (userCanDo(currentUser, 'posts.view.all')) {
    return true
  } else if (userOwns(currentUser, post) || userIsSharedOn(currentUser, post) || await userIsPostGroupOrganizer(currentUser, post, context)) {
    return true;
  } else if (!currentUser && !!canonicalLinkSharingKey && constantTimeCompare({ correctValue: canonicalLinkSharingKey, unknownValue: unvalidatedLinkSharingKey })) {
    return true;
  } else if (post.isFuture || post.draft || post.deletedDraft) {
    return false;
    // TODO: consider getting rid of this clause entirely and instead just relying on default view filter, 
    // since LW is now allowing people to see rejected content and preventing them from seeing 'not-yet-rejected
    // content is kinda weird)
  } else if (post.authorIsUnreviewed && !post.rejected) {
    return false
  } else {
    const status = _.findWhere(postStatusLabels, {value: post.status});
    if (!status) return false;
    return userCanDo(currentUser, `posts.view.${status.label}`);
  }
}
