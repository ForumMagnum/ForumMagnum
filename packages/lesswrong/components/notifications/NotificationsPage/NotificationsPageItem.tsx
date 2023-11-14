import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import type { ForumIconName } from "../../common/ForumIcon";
import type { NotificationDisplay } from "../../../lib/types/notificationDisplayTypes";
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
  iconGreen: {
    backgroundColor: theme.palette.icon.recentDiscussionGreen,
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

type DisplayDetails = {
  type: string,
  icon: ForumIconName,
  iconVariant: "primary" | "grey" | "green",
  user: UsersMinimumInfo | null,
  action: string,
  post: NotificationDisplay["post"],
  link: string,
  timestamp: Date,
}

const getDisplayDetails = ({
  type,
  link,
  createdAt,
  post,
  comment,
  // tag,
  user,
  // localgroup,
}: NotificationDisplay): DisplayDetails | null => {
  return {
    type,
    ...(comment
      ? {icon: "CommentFilled", iconVariant: "primary"}
      : {icon: "DocumentFilled", iconVariant: "grey"}
    ),
    user: (user ?? post?.user ?? comment?.user ?? null) as UsersMinimumInfo | null,
    action: "created a new post", // TODO: Fetch correct action string
    post,
    link,
    timestamp: new Date(createdAt),
  };
}

export const NotificationsPageItem = ({notification, classes}: {
  notification: NotificationDisplay,
  classes: ClassesType<typeof styles>,
}) => {
  const displayDetails = getDisplayDetails(notification);
  if (!displayDetails) {
    return null;
  }
  const {
    icon,
    iconVariant,
    user,
    action,
    post,
    link,
    timestamp,
  } = displayDetails;
  const {ForumIcon, UsersNameDisplay, FormatDate} = Components;
  return (
    <AnalyticsContext pageSubSectionContext="notificationsPageItem">
      <div className={classes.root}>
        <div className={classes.container}>
          <div className={classNames(classes.iconContainer, {
            [classes.iconPrimary]: iconVariant === "primary",
            [classes.iconGrey]: iconVariant === "grey",
            [classes.iconGreen]: iconVariant === "green",
          })}>
            <ForumIcon icon={icon} />
          </div>
          <div className={classes.meta}>
            <UsersNameDisplay user={user} className={classes.primaryText} />
            {" "}
            {action}
            {" "}
            {post &&
              <Link
                to={link ?? postGetPageUrl(post)}
                className={classes.primaryText}
                eventProps={{intent: "expandPost"}}
              >
                {post.title}
              </Link>
            }
            {/*
            {tag &&
              <TagTooltipWrapper tag={tag} As="span">
                <Link to={tagGetUrl(tag)} className={classes.primaryText}>
                  {tag.name}
                </Link>
              </TagTooltipWrapper>
            }
              */}
            {" "}
            <FormatDate date={timestamp} includeAgo />
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
