import React, { FC } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import {
  NotificationDisplay,
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
});

export const NotificationsPageItem = ({notification, classes}: {
  notification: NotificationDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const {type, createdAt, comment, post, user, link} = notification;
  const notificationType = getNotificationTypeByName(type);
  if (!notificationType.Display) {
    return null;
  }

  const displayUser = (
    user ??
    post?.user ??
    comment?.user
  ) as UsersMinimumInfo | undefined;
  const displayPost = post ?? comment?.post;

  const {ForumIcon, UsersNameDisplay, FormatDate} = Components;
  const User: FC = () => (
    <UsersNameDisplay user={displayUser} className={classes.primaryText} />
  );
  const Post: FC = () => displayPost
    ? (
      <Link
        to={link ?? postGetPageUrl(displayPost)}
        className={classes.primaryText}
        eventProps={{intent: "expandPost"}}
      >
        {displayPost.title}
      </Link>
    )
    : null;
  const display = (
    <notificationType.Display
      notification={notification}
      User={User}
      Post={Post}
    />
  );

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
            {display} <FormatDate date={new Date(createdAt)} includeAgo />
          </div>
        </div>
        {/*
        <div className={classes.container}>
          <div className={classNames(classes.iconContainer, classes.hideOnMobile)} />
          <div className={classes.content}>
            {children}
          </div>
        </div>
          */}
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
