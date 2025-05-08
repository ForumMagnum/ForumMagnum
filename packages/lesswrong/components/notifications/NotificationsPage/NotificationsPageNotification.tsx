import React, { FC, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
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
import { sequenceGetPageUrl } from "../../../lib/collections/sequences/helpers";

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

export const getDisplayConfig = ({
  type,
  comment,
}: NotificationDisplay): DisplayConfig => {
  try {
    const {Display} = getNotificationTypeByName(type);
    return {
      Display,
      ...(comment
        ? {Icon: "CommentFilled", iconVariant: "primary"}
        : {Icon: "DocumentFilled", iconVariant: "grey"}
      ),
      ...(type === "wrapped" &&
        {Icon: "Gift", iconVariant: "wrapped"}
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

export const NotificationsPageNotificationInner = ({
  notification,
  hideCommentPreviews,
  classes,
}: {
  notification: NotificationDisplay,
  hideCommentPreviews?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const {Display, Icon, iconVariant} = getDisplayConfig(notification);
  const {
    createdAt, comment, post, user, tag, sequence, localgroup, link, tagRelId,
  } = notification;
  const displayUser = (
    user ??
    post?.user ??
    comment?.user
  ) as UsersMinimumInfo | undefined;
  const displayPost = post ?? comment?.post;
  const displayLocalgroup = localgroup ?? post?.group;

  // These temporary components are passed into the `Display` functions of
  // the various notification types (see `lib/notificationTypes.ts`) to generate
  // interactive notification displays. They _must_ be wrapped in `useCallback`
  // otherwise rerenders will badly break referential transparency.
  const User: FC = useCallback(() => (
    <Components.UsersName
      user={displayUser}
      tooltipPlacement="bottom-start"
      className={classes.primaryText}
    />
  ), [displayUser, classes]);
  const LazyUser: FC<{userId: string}> = useCallback(({userId}) => (
    <Components.UsersName
      documentId={userId}
      tooltipPlacement="bottom-start"
      className={classes.primaryText}
    />
  ), [classes]);
  const Post: FC = useCallback(() => displayPost
    ? (
      <Components.PostsTooltip
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
      </Components.PostsTooltip>
    )
    : null, [displayPost, link, tagRelId, classes]);
  const Comment: FC = useCallback(() => comment
    ? (
      <Components.PostsTooltip
        postId={comment.post?._id ?? displayPost?._id}
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
      </Components.PostsTooltip>
    )
    : null, [comment, displayPost, tag, tagRelId, classes]);
  const Tag: FC = useCallback(() => tag
    ? (
      <Link
        to={link ?? tagGetUrl(tag)}
        className={classes.primaryText}
        eventProps={{intent: "expandTag"}}
      >
        {tag.name}
      </Link>
    )
    : null, [link, tag, classes]);
  const Sequence: FC = useCallback(() => sequence
    ? (
      <Link
        to={link ?? sequenceGetPageUrl(sequence)}
        className={classes.primaryText}
        eventProps={{intent: "expandSequence"}}
      >
        {sequence.title}
      </Link>
    )
    : null, [link, sequence, classes]);
  const Localgroup: FC = useCallback(() => displayLocalgroup
    ? (
      <Link
        to={link ?? localgroupGetUrl(displayLocalgroup)}
        className={classes.primaryText}
        eventProps={{intent: "expandLocalgroup"}}
      >
        {displayLocalgroup.name}
      </Link>
    )
    : null, [displayLocalgroup, link, classes]);

  if (!Display) {
    return null;
  }

  const previewCommentId = hideCommentPreviews
    ? undefined
    : notification.comment?._id;

  const {NotificationsPageItem} = Components;
  return (
    <NotificationsPageItem
      Icon={Icon}
      iconVariant={iconVariant}
      post={post as PostsMinimumInfo | undefined}
      previewCommentId={previewCommentId}
    >
      <Display
        notification={notification}
        User={User}
        LazyUser={LazyUser}
        Post={Post}
        Comment={Comment}
        Tag={Tag}
        Sequence={Sequence}
        Localgroup={Localgroup}
      /> <Components.FormatDate date={new Date(createdAt)} includeAgo />
    </NotificationsPageItem>
  );
}

export const NotificationsPageNotification = registerComponent(
  "NotificationsPageNotification",
  NotificationsPageNotificationInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageNotification: typeof NotificationsPageNotification
  }
}
