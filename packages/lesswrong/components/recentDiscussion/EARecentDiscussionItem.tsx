import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import type { ForumIconName } from "../common/ForumIcon";
import { tagGetUrl } from "../../lib/collections/tags/helpers";
import classNames from "classnames";

const ICON_WIDTH = 24;
const GAP = 12;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[600],
    margin: "28px 0",
    "&:first-child": {
      marginTop: 8,
    },
  },
  primaryText: {
    color: theme.palette.grey[1000],
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.text.alwaysWhite,
    borderRadius: "50%",
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
  container: {
    width: `calc(100% - ${ICON_WIDTH + GAP}px)`,
  },
  meta: {
    marginBottom: 12,
    lineHeight: "1.5em",
    fontWeight: 500,
  },
  content: {
    flexGrow: 1,
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
    color: theme.palette.grey[1000],
    padding: 12,
  },
});

type EARecentDiscussionItemDocument = {
  post: PostsRecentDiscussion,
  tag?: never,
} | {
  post?: never,
  tag: TagBasicInfo,
};

export type EARecentDiscussionItemProps = EARecentDiscussionItemDocument & {
  icon: ForumIconName,
  iconVariant: "primary" | "grey" | "green",
  user?: UsersMinimumInfo | null,
  description: string,
  postTitleOverride?: string,
  postUrlOverride?: string,
  timestamp: Date,
}

const EARecentDiscussionItem = ({
  icon,
  iconVariant,
  user,
  description,
  postTitleOverride,
  postUrlOverride,
  post,
  tag,
  timestamp,
  children,
  classes,
}: EARecentDiscussionItemProps & {
  children: ReactNode,
  classes: ClassesType,
}) => {
  const {ForumIcon, UsersNameDisplay, FormatDate} = Components;
  return (
    <div className={classes.root}>
      <div className={classNames(classes.iconContainer, {
        [classes.iconPrimary]: iconVariant === "primary",
        [classes.iconGrey]: iconVariant === "grey",
        [classes.iconGreen]: iconVariant === "green",
      })}>
        <ForumIcon icon={icon} />
      </div>
      <div className={classes.container}>
        <div className={classes.meta}>
          <UsersNameDisplay user={user} className={classes.primaryText} />
          {" "}
          {description}
          {" "}
          {post &&
            <Link
              to={postUrlOverride ?? postGetPageUrl(post)}
              className={classes.primaryText}
            >
              {postTitleOverride ?? post.title}
            </Link>
          }
          {tag &&
            <Link to={tagGetUrl(tag)} className={classes.primaryText}>
              {tag.name}
            </Link>
          }
          {" "}
          <FormatDate date={timestamp} includeAgo />
        </div>
        <div className={classes.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const EARecentDiscussionItemComponent = registerComponent(
  "EARecentDiscussionItem",
  EARecentDiscussionItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionItem: typeof EARecentDiscussionItemComponent,
  }
}
