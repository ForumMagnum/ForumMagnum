import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import type { ForumIconName } from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[600],
    margin: "20px 0",
  },
  primaryText: {
    color: theme.palette.grey[1000],
  },
  container: {
    width: "100%",
  },
  meta: {
    marginBottom: 14,
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

const EARecentDiscussionItem = ({
  icon,
  user,
  description,
  post,
  timestamp,
  children,
  classes,
}: {
  icon: ForumIconName,
  user?: UsersMinimumInfo | null,
  description: string,
  post: PostsRecentDiscussion,
  timestamp: Date,
  children: ReactNode,
  classes: ClassesType,
}) => {
  const {ForumIcon, UsersNameDisplay, FormatDate} = Components;
  return (
    <div className={classes.root}>
      <div>
        <ForumIcon icon={icon} />
      </div>
      <div className={classes.container}>
        <div className={classes.meta}>
          <UsersNameDisplay user={user} className={classes.primaryText} />
          {" "}
          {description}
          {" "}
          <Link to={postGetPageUrl(post)} className={classes.primaryText}>
            {post.title}
          </Link>
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
