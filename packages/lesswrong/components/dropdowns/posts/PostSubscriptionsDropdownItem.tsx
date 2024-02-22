import React, { useMemo } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { subscriptionTypes } from "../../../lib/collections/subscriptions/schema";
import { userGetDisplayName } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { isDialogueParticipant } from "../../posts/PostsPage/PostsPage";
import { isFriendlyUI } from "../../../themes/forumTheme";
import Card from "@material-ui/core/Card";

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
    title: `New posts from ${post.group?.name}`,
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
    title: "New responses in dialogue",
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

const styles = (_theme: ThemeType) => ({
  dropdownWrapper: {
    padding: "0 14px 0 10px",
    transform: "translateX(2px)",
  },
});

export const PostSubscriptionsDropdownItem = ({post, classes}: {
  post: PostsList|SunshinePostsList,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const userIsDialogueParticipant = currentUser && isDialogueParticipant(currentUser._id, post);
  const showSubscribeToDialogueButton = post.collabEditorDialogue && !userIsDialogueParticipant;

  const notifyMeItems = useMemo(() => {
    return getNotifyMeItems({post, currentUser, showSubscribeToDialogueButton});
  }, [post, currentUser, showSubscribeToDialogueButton]);

  const {
    LWTooltip, DropdownMenu, DropdownItem, NotifyMeDropdownItem,
    NotifyMeToggleDropdownItem,
  } = Components;
  return isFriendlyUI
    ? (
      <LWTooltip
        title={
          <div className={classes.dropdownWrapper}>
            <Card>
              <DropdownMenu>
                {notifyMeItems.map((props) =>
                  <NotifyMeToggleDropdownItem {...props} key={props.subscribeMessage} />
                )}
              </DropdownMenu>
            </Card>
          </div>
        }
        clickable
        tooltip={false}
        inlineBlock={false}
        placement="right-start"
      >
        <DropdownItem
          title="Get notified"
          icon="BellBorder"
          afterIcon="ThickChevronRight"
        />
      </LWTooltip>
    )
    : (
      <>
        {notifyMeItems.map((props) =>
          <NotifyMeDropdownItem {...props} key={props.subscribeMessage} />
        )}
      </>
    );
}

const PostSubscriptionsDropdownItemComponent = registerComponent(
  "PostSubscriptionsDropdownItem",
  PostSubscriptionsDropdownItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostSubscriptionsDropdownItem: typeof PostSubscriptionsDropdownItemComponent
  }
}
