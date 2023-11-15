import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useSingle } from "../../../lib/crud/withSingle";
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
import classNames from "classnames";

const ICON_WIDTH = 24;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[600],
    margin: "28px 0",
    "&:first-child": {
      marginTop: 8,
    },
  },
  container: {
    display: "flex",
    gap: "8px",
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.text.alwaysWhite,
    borderRadius: "50%",
    minWidth: ICON_WIDTH,
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    "& svg": {
      width: 14,
      height: 14,
    },
  },
  iconPrimary: {
    backgroundColor: theme.palette.primary.main,
  },
  iconGrey: {
    backgroundColor: theme.palette.icon.recentDiscussionGrey,
  },
  meta: {
    marginBottom: 12,
    lineHeight: "1.5em",
    fontWeight: 500,
  },
  primaryText: {
    color: theme.palette.grey[1000],
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  preview: {
    flexGrow: 1,
    minWidth: 0,
  },
});

const getNotificationDisplay = (
  notificationType: string,
): NotificationType["Display"] | null => {
  if (notificationType === "reaction") {
    return ({User, Post, Comment, notification: {comment}}) =>
      comment
        ? <><User /> reacted to your <Comment /> on <Post /></>
        : <><User /> reacted to <Post /></>
  }

  try {
    const {Display} = getNotificationTypeByName(notificationType);
    return Display;
  } catch (e) {
    // esline-disable-next-line no-console
    console.error("Invalid notification type:", notificationType, e);
  }

  return null;
}

export const NotificationsPageItem = ({notification, classes}: {
  notification: NotificationDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const showPreviewComment = !!notification.comment?._id &&
    notification.type !== "reaction";

  // The main notifications query that returns `NotificationDisplay`s is a
  // custom resolver that runs as a single SQL query. We fetch comments to
  // preview outside of this query in order to avoid nuking the apollo cache
  // when trying to do things like loading the parent comment, and also
  // because it'd be tricky to fetch things like the current user vote without
  // running typescript resolvers.
  const {
    document: previewComment,
    loading: previewCommentLoading,
  } = useSingle({
    skip: !showPreviewComment,
    documentId: notification.comment?._id,
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });

  const Display = getNotificationDisplay(notification.type);
  if (!Display) {
    return null;
  }

  const {createdAt, comment, post, user, tag, localgroup, link} = notification;
  const displayUser = (
    user ??
    post?.user ??
    comment?.user
  ) as UsersMinimumInfo | undefined;
  const displayPost = post ?? comment?.post;
  const displayLocalgroup = localgroup ?? post?.group;

  const {
    ForumIcon, UsersNameDisplay, PostsTooltip, FormatDate, Loading,
    CommentsNode,
  } = Components;
  const User: FC = () => (
    <UsersNameDisplay
      user={displayUser}
      tooltipPlacement="bottom-start"
      className={classes.primaryText}
    />
  );
  const Post: FC = () => displayPost
    ? (
      <PostsTooltip post={displayPost as PostsList}>
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
      <Link
        to={commentGetPageUrlFromIds({
          commentId: comment._id,
          postId: comment.post?._id,
          postSlug: comment.post?.slug,
          tagSlug: tag?.slug, // TODO: This probably doesn't work for tags yet?
        })}
        className={classes.primaryText}
        eventProps={{intent: "expandComment"}}
      >
        comment
      </Link>
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

  const {icon, iconVariant} = comment
    ? {icon: "CommentFilled", iconVariant: "primary"} as const
    : {icon: "DocumentFilled", iconVariant: "grey"} as const;

  return (
    <AnalyticsContext pageSubSectionContext="notificationsPageItem">
      <div className={classes.root}>
        <div className={classes.container}>
          <div className={classNames(classes.iconContainer, {
            [classes.iconPrimary]: iconVariant === "primary",
            [classes.iconGrey]: iconVariant === "grey",
          })}>
            <ForumIcon icon={icon} />
          </div>
          <div className={classes.meta}>
            <Display
              notification={notification}
              User={User}
              Post={Post}
              Comment={Comment}
              Tag={Tag}
              Localgroup={Localgroup}
            /> <FormatDate date={new Date(createdAt)} includeAgo />
          </div>
        </div>
        {showPreviewComment &&
          <div className={classes.container}>
            <div className={classNames(
              classes.iconContainer,
              classes.hideOnMobile,
            )} />
            <div className={classes.preview}>
              {previewCommentLoading && <Loading />}
              {previewComment &&
                <CommentsNode
                  treeOptions={{
                    scrollOnExpand: true,
                    condensed: true,
                    post: post as PostsMinimumInfo | undefined,
                  }}
                  startThreadTruncated
                  expandAllThreads
                  expandNewComments={false}
                  nestingLevel={1}
                  comment={previewComment}
                />
              }
            </div>
          </div>
        }
      </div>
    </AnalyticsContext>
  );
}

const NotificationsPageItemComponent = registerComponent(
  "NotificationsPageItem",
  NotificationsPageItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageItem: typeof NotificationsPageItemComponent
  }
}
