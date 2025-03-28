import React, { useMemo } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { subscriptionTypes } from "../../../lib/collections/subscriptions/helpers";
import { userGetDisplayName } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { isDialogueParticipant } from "../../posts/PostsPage/PostsPage";
import { isAdmin } from "../../../lib/vulcan-users/permissions";
import { userHasSubscribeTabFeed } from "../../../lib/betas";

/**
 * A list of props that go into each subscription menu item,
 * pulled out so that friendly sites can display them differently.
 */
const getNotifyMeItems = ({post, currentUser, showSubscribeToDialogueButton}: {
  post: PostsList|SunshinePostsList,
  currentUser: UsersCurrent | null,
  showSubscribeToDialogueButton: boolean,
}) => [
  {
    document: post.group,
    enabled: !!post.group,
    subscribeMessage: `Subscribe to ${post.group?.name}`,
    unsubscribeMessage: `Unsubscribe from ${post.group?.name}`,
    title: `New ${post.group?.name} events`,
    subscriptionType: subscriptionTypes.newEvents,
  },
  {
    document: post,
    enabled: post.shortform && post.userId !== currentUser?._id,
    subscribeMessage: `Subscribe to ${post.title}`,
    unsubscribeMessage: `Unsubscribe from ${post.title}`,
    title: `New quick takes from ${userGetDisplayName(post.user)}`,
    subscriptionType: subscriptionTypes.newShortform,
  },
  {
    document: post.user,
    enabled: !!post.user && post.user._id !== currentUser?._id,
    subscribeMessage: `Subscribe to posts by ${userGetDisplayName(post.user)}`,
    unsubscribeMessage: `Unsubscribe from posts by ${userGetDisplayName(post.user)}`,
    title: `New posts by ${userGetDisplayName(post.user)}`,
    subscriptionType: subscriptionTypes.newPosts,
  },
  {
    document: post,
    enabled: !!post.collabEditorDialogue && showSubscribeToDialogueButton,
    subscribeMessage: "Subscribe to dialogue",
    unsubscribeMessage: "Unsubscribe from dialogue",
    title: "New responses in this dialogue",
    subscriptionType: subscriptionTypes.newPublishedDialogueMessages,
    tooltip: "Notifies you when there is new activity in the dialogue",
  },
  {
    document: post,
    subscribeMessage: "Subscribe to comments on this post",
    unsubscribeMessage: "Unsubscribe from comments on this post",
    title: "New comments on this post",
    subscriptionType: subscriptionTypes.newComments
  },
];

/**
 * On friendly sites, this is a single menu item that opens a submenu with subscription options.
 * On other sites, the subscription options are individual menu items.
 */
export const PostSubscriptionsDropdownItem = ({post}: {
  post: PostsList|SunshinePostsList,
}) => {
  const currentUser = useCurrentUser();

  const userIsDialogueParticipant = currentUser && isDialogueParticipant(currentUser._id, post);
  const showSubscribeToDialogueButton = post.collabEditorDialogue && !userIsDialogueParticipant;

  const notifyMeItems = useMemo(() => {
    return getNotifyMeItems({post, currentUser, showSubscribeToDialogueButton});
  }, [post, currentUser, showSubscribeToDialogueButton]);

  const {
    CombinedSubscriptionsDropdownItem
  } = Components;

  return <CombinedSubscriptionsDropdownItem notifyMeItems={notifyMeItems} />
}

const PostSubscriptionsDropdownItemComponent = registerComponent(
  "PostSubscriptionsDropdownItem",
  PostSubscriptionsDropdownItem,
);

declare global {
  interface ComponentTypes {
    PostSubscriptionsDropdownItem: typeof PostSubscriptionsDropdownItemComponent
  }
}
