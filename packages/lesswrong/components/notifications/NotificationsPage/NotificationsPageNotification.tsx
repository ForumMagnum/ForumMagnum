import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import { localgroupGetUrl } from "../../../lib/collections/localgroups/helpers";
import {
  NotificationDisplay,
  NotificationType,
  getNotificationTypeByName,
} from "../../../lib/notificationTypes";
import type { ForumIconName } from "../../common/ForumIcon";
import type { IconVariant } from "./NotificationsPageItem";

const styles = (theme: ThemeType) => ({
  primaryText: {
    color: theme.palette.grey[1000],
  },
});

type DisplayConfig = {
  Display: NotificationType["Display"] | null,
  Icon: ForumIconName | FC,
  iconVariant: IconVariant,
}

const getDisplayConfig = ({type, comment}: NotificationDisplay): DisplayConfig => {
  try {
    const {Display} = getNotificationTypeByName(type);
    return {
      Display,
      ...(comment
        ? {Icon: "CommentFilled", iconVariant: "primary"}
        : {Icon: "DocumentFilled", iconVariant: "grey"}
      ),
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Invalid notification type:", type, e);
  }

  return {
    Display: null,
    Icon: "DocumentFilled",
    iconVariant: "grey",
  };
}

export const NotificationsPageNotification = ({notification, classes}: {
  notification: NotificationDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const {Display, Icon, iconVariant} = getDisplayConfig(notification);
  if (!Display) {
    return null;
  }

  const {
    createdAt, comment, post, user, tag, localgroup, link, tagRelId,
  } = notification;
  const displayUser = (
    user ??
    post?.user ??
    comment?.user
  ) as UsersMinimumInfo | undefined;
  const displayPost = post ?? comment?.post;
  const displayLocalgroup = localgroup ?? post?.group;

  const {UsersName, PostsTooltip, FormatDate, NotificationsPageItem} = Components;
  const User: FC = () => (
    <UsersName
      user={displayUser}
      tooltipPlacement="bottom-start"
      className={classes.primaryText}
    />
  );
  const LazyUser: FC<{userId: string}> = ({userId}) => (
    <UsersName
      documentId={userId}
      tooltipPlacement="bottom-start"
      className={classes.primaryText}
    />
  );
  const Post: FC = () => displayPost
    ? (
      <PostsTooltip
        post={displayPost as unknown as PostsList}
        tagRelId={tagRelId}
      >
        <Link
          to={link ?? postGetPageUrl(displayPost)}
          className={classes.primaryText}
          eventProps={{intent: "expandPost"}}
        >
          {displayPost.title}
        </Link>
      </PostsTooltip>
    )
    : null;
  const Comment: FC = () => comment
    ? (
      <PostsTooltip
        postId={displayPost?._id}
        commentId={comment._id}
        tagRelId={tagRelId}
      >
        <Link
          to={commentGetPageUrlFromIds({
            commentId: comment._id,
            postId: comment.post?._id,
            postSlug: comment.post?.slug,
            tagSlug: tag?.slug,
          })}
          className={classes.primaryText}
          eventProps={{intent: "expandComment"}}
        >
          comment
        </Link>
      </PostsTooltip>
    )
    : null;
  const Tag: FC = () => tag
    ? (
      <Link
        to={link ?? tagGetUrl(tag)}
        className={classes.primaryText}
        eventProps={{intent: "expandTag"}}
      >
        {tag.name}
      </Link>
    )
    : null;
  const Localgroup: FC = () => displayLocalgroup
    ? (
      <Link
        to={link ?? localgroupGetUrl(displayLocalgroup)}
        className={classes.primaryText}
        eventProps={{intent: "expandLocalgroup"}}
      >
        {displayLocalgroup.name}
      </Link>
    )
    : null;

  return (
    <NotificationsPageItem
      Icon={Icon}
      iconVariant={iconVariant}
      post={post as PostsMinimumInfo | undefined}
      previewCommentId={notification.comment?._id}
    >
      <Display
        notification={notification}
        User={User}
        LazyUser={LazyUser}
        Post={Post}
        Comment={Comment}
        Tag={Tag}
        Localgroup={Localgroup}
      /> <FormatDate date={new Date(createdAt)} includeAgo />
    </NotificationsPageItem>
  );
}

const NotificationsPageNotificationComponent = registerComponent(
  "NotificationsPageNotification",
  NotificationsPageNotification,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageNotification: typeof NotificationsPageNotificationComponent
  }
}
