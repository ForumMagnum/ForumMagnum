import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useSingle } from "../../../lib/crud/withSingle";
import { Link } from "../../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import { localgroupGetUrl } from "../../../lib/collections/localgroups/helpers";
import { getEAPublicEmojiByName } from "../../../lib/voting/eaEmojiPalette";
import {
  NotificationDisplay,
  NotificationType,
  getNotificationTypeByName,
} from "../../../lib/notificationTypes";
import type { ForumIconName } from "../../common/ForumIcon";
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
  karma: {
    marginRight: "5px",
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
  iconYellow: {
    color: theme.palette.icon.headerKarma,
    backgroundColor: "transparent",
    transform: "scale(1.5)",
  },
  iconClear: {
    color: theme.palette.primary.main,
    backgroundColor: "transparent",
    transform: "scale(1.5)",
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

const getFirstReaction = (extendedVoteType: unknown) => {
  if (typeof extendedVoteType !== "object" || !extendedVoteType) {
    return null;
  }
  const voteType = extendedVoteType as Record<string, boolean>;
  for (const name in extendedVoteType) {
    if (!voteType[name]) {
      continue;
    }
    const emojiOption = getEAPublicEmojiByName(name);
    if (emojiOption) {
      return emojiOption;
    }
  }
  return null;
}

type DisplayConfig = {
  Display: NotificationType["Display"] | null,
  Icon: ForumIconName | FC,
  iconVariant: "primary" | "grey" | "yellow" | "clear",
}

const emptyDisplay = {
  Display: null,
  Icon: "DocumentFilled",
  iconVariant: "grey",
} as const;

const getDisplayConfig = (
  {type, karmaChange, extendedVoteType, post, comment, tag}: NotificationDisplay,
  classes: ClassesType<typeof styles>,
): DisplayConfig => {
  if (type === "karmaChange") {
    if (!karmaChange) {
      return emptyDisplay;
    }
    const amountText = karmaChange > 0 ? `+${karmaChange}` : String(karmaChange);
    return {
      Display: ({Post, Comment, Tag}) => (
        <>
          <span className={classes.karma}>{amountText} karma</span>
          {post && <Post />}
          {comment && <><Comment /> on <Post /></>}
          {tag && <Tag />}
        </>
      ),
      Icon: "Star",
      iconVariant: "yellow",
    };
  }

  if (type === "reaction") {
    const reaction = getFirstReaction(extendedVoteType);
    if (!reaction) {
      return emptyDisplay;
    }
    return {
      Display: ({User, Post, Comment, notification: {comment}}) =>
        comment
          ? <><User /> reacted to your <Comment /> on <Post /></>
          : <><User /> reacted to <Post /></>,
      Icon: reaction.Component,
      iconVariant: "clear",
    };
  }

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

  return emptyDisplay;
}

export const NotificationsPageItem = ({notification, classes}: {
  notification: NotificationDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const showPreviewComment =
    !!notification.comment?._id &&
    notification.type !== "reaction" &&
    notification.type !== "karmaChange";

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

  const {Display, Icon, iconVariant} = getDisplayConfig(notification, classes);
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
    ForumIcon, UsersName, PostsTooltip, FormatDate, Loading, CommentsNode,
  } = Components;
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
      <PostsTooltip post={displayPost as unknown as PostsList}>
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

  return (
    <AnalyticsContext pageSubSectionContext="notificationsPageItem">
      <div className={classes.root}>
        <div className={classes.container}>
          <div className={classNames(classes.iconContainer, {
            [classes.iconPrimary]: iconVariant === "primary",
            [classes.iconGrey]: iconVariant === "grey",
            [classes.iconYellow]: iconVariant === "yellow",
            [classes.iconClear]: iconVariant === "clear",
          })}>
            {typeof Icon === "string"
              ? <ForumIcon icon={Icon} />
              : <Icon />
            }
          </div>
          <div className={classes.meta}>
            <Display
              notification={notification}
              User={User}
              LazyUser={LazyUser}
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
