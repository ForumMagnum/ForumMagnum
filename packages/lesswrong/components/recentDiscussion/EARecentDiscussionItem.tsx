import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import type { ForumIconName } from "../common/ForumIcon";
import { tagGetUrl } from "../../lib/collections/tags/helpers";

const ICON_WIDTH = 24;
const GAP = 12;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    gap: `${GAP}px`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[600],
    margin: "20px 0",
  },
  primaryText: {
    color: theme.palette.grey[1000],
  },
  iconContainer: {
    width: ICON_WIDTH,
  },
  container: {
    width: `calc(100% - ${ICON_WIDTH + GAP}px)`,
  },
  meta: {
    marginBottom: 14,
    lineHeight: "1.5em",
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
  user?: UsersMinimumInfo | null,
  description: string,
  timestamp: Date,
}

const EARecentDiscussionItem = ({
  icon,
  user,
  description,
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
      <div>
        <ForumIcon icon={icon} />
      </div>
      <div className={classes.container}>
        <div className={classes.meta}>
          <UsersNameDisplay user={user} className={classes.primaryText} />
          {" "}
          {description}
          {" "}
          {post &&
            <Link to={postGetPageUrl(post)} className={classes.primaryText}>
              {post.title}
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
