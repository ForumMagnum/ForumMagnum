import React, { useMemo } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { subscriptionTypes } from "../../../lib/collections/subscriptions/helpers";
import { userGetDisplayName } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { allowSubscribeToUserComments } from "../../../lib/betas";
import { CombinedSubscriptionsDropdownItem } from "../CombinedSubscriptionsDropdownItem";

/**
 * A list of props that go into each subscription menu item,
 * pulled out so that friendly sites can display them differently.
 */
const getNotifyMeItems = ({comment, post, currentUser, enableSubscribeToCommentUser}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
  currentUser: UsersCurrent | null,
  enableSubscribeToCommentUser: boolean,
}) => [
  {
    document: post,
    enabled: Boolean(
      post &&
      comment.shortform &&
      !comment.topLevelCommentId &&
      (comment.user?._id && (comment.user._id !== currentUser?._id))
    ),
    subscribeMessage: `Subscribe to ${post?.title}`,
    unsubscribeMessage: `Unsubscribe from ${post?.title}`,
    title: `New quick takes from ${userGetDisplayName(comment.user)}`,
    subscriptionType: subscriptionTypes.newShortform,
  },
  {
    document: comment,
    subscribeMessage: `Subscribe to this comment's replies`,
    unsubscribeMessage: `Unsubscribe from this comment's replies`,
    title: `New replies to this comment`,
    subscriptionType: subscriptionTypes.newReplies,
  },
  {
    document: comment.user,
    enabled: enableSubscribeToCommentUser,
    subscribeMessage: `Subscribe to posts by ${userGetDisplayName(comment.user)}`,
    unsubscribeMessage: `Unsubscribe from posts by ${userGetDisplayName(comment.user)}`,
    title: `New posts by ${userGetDisplayName(comment.user)}`,
    subscriptionType: subscriptionTypes.newPosts,
  },
  {
    document: comment.user,
    enabled: enableSubscribeToCommentUser && allowSubscribeToUserComments,
    subscribeMessage: `Subscribe to all comments by ${userGetDisplayName(comment.user)}`,
    unsubscribeMessage: `Unsubscribe from all comments by ${userGetDisplayName(comment.user)}`,
    title: `New comments by ${userGetDisplayName(comment.user)}`,
    subscriptionType: subscriptionTypes.newUserComments,
  },
];

/**
 * On friendly sites, this is a single menu item that opens a submenu with subscription options.
 * On other sites, the subscription options are individual menu items.
 */
export const CommentSubscriptionsDropdownItemInner = ({comment, post}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
}) => {
  const currentUser = useCurrentUser();

  const enableSubscribeToCommentUser = Boolean(
    comment.user?._id &&
    (comment.user._id !== currentUser?._id) &&
    !comment.deleted
  );

  const notifyMeItems = useMemo(() => {
    return getNotifyMeItems({comment, post, currentUser, enableSubscribeToCommentUser});
  }, [comment, post, currentUser, enableSubscribeToCommentUser]);
  return <CombinedSubscriptionsDropdownItem notifyMeItems={notifyMeItems} />
}

export const CommentSubscriptionsDropdownItem = registerComponent(
  "CommentSubscriptionsDropdownItem",
  CommentSubscriptionsDropdownItemInner,
);


