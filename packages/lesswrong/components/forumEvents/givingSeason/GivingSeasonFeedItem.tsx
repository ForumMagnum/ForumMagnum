import React from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import {
  InteractionWrapper,
  useClickableCell,
} from "@/components/common/useClickableCell";
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";
import FormatDate from "@/components/common/FormatDate";
import ForumIcon from "@/components/common/ForumIcon";
import UsersName from "@/components/users/UsersName";
import classNames from "classnames";

const styles = defineStyles("GivingSeasonFeedItem", (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    gap: "8px",
    fontSize: 14,
    lineHeight: "140%",
    padding: 8,
    borderRadius: theme.borderRadius.default,
    overflow: "hidden",
    cursor: "pointer",
    "&:hover .GivingSeasonFeedItem-background": {
      opacity: 0.2,
    },
  },
  background: {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "var(--event-color)",
    opacity: 0,
    transition: "opacity ease 0.2s",
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    padding: 4,
    width: 24,
    minWidth: 24,
    maxWidth: 24,
    height: 24,
    minHeight: 24,
    maxHeight: 24,
    "& svg": {
      width: 12,
    },
  },
  postIcon: {
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.primary.main,
  },
  commentIcon: {
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.grey[600],
  },
  detailsWrapper: {
    minWidth: 0,
    width: "100%",
    fontWeight: 600,
  },
  user: {
    fontWeight: 700,
  },
  action: {
    opacity: 0.7,
  },
  date: {
    opacity: 0.7,
    float: "right",
    whiteSpace: "nowrap",
    marginRight: 12,
  },
  info: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  post: {
    textDecoration: "underline",
    fontWeight: 700,
  },
  preview: {
    color: "var(--event-color)",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  interaction: {
    display: "inline",
  },
}))

export const GivingSeasonFeedItem = ({
  href,
  iconStyle,
  action,
  user,
  post,
  date,
  preview,
}: {
  href: string,
  iconStyle: "post" | "comment",
  action: string,
  user: UsersMinimumInfo | null,
  post: PostsMinimumInfo | null,
  date: Date,
  preview: string,
}) => {
  const {onClick} = useClickableCell({href, ignoreLinks: true});
  const classes = useStyles(styles);
  if (!post) {
    return null;
  }
  return (
    <div onClick={onClick} className={classes.root}>
      <div className={classes.background} />
      <div
        className={classNames(
          classes.icon,
          iconStyle === "post" ? classes.postIcon : classes.commentIcon,
        )}
      >
        <ForumIcon
          icon={iconStyle === "post" ? "DocumentFilled" : "CommentFilled"}
        />
      </div>
      <div className={classes.detailsWrapper}>
        <div>
          <FormatDate
            date={date}
            tooltip={false}
            includeAgo
            className={classes.date}
          />
          <div className={classes.info}>
            <InteractionWrapper className={classes.interaction}>
              <UsersName
                user={user}
                tooltipPlacement="bottom-start"
                className={classes.user}
              />
            </InteractionWrapper>{" "}
            <span className={classes.action}>{action}</span>{" "}
            <InteractionWrapper className={classes.interaction}>
              <PostsTooltip postId={post._id} placement="bottom-start">
                <Link
                  to={postGetPageUrl(post)}
                  className={classes.post}
                >
                  {post.title}
                </Link>
              </PostsTooltip>
            </InteractionWrapper>
          </div>
        </div>
        <div className={classes.preview}>
          {preview}
        </div>
      </div>
    </div>
  );
}

export default registerComponent("GivingSeasonFeedItem", GivingSeasonFeedItem);
