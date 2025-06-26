import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import ForumIcon, { ForumIconName } from "../common/ForumIcon";
import { tagGetUrl } from "../../lib/collections/tags/helpers";
import classNames from "classnames";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import UsersNameDisplay from "../users/UsersNameDisplay";
import FormatDate from "../common/FormatDate";
import TagsTooltip from "../tagging/TagsTooltip";

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
  primaryText: {
    color: theme.palette.grey[1000],
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
  container: {
    display: "flex",
    gap: "8px",
  },
  meta: {
    marginBottom: 12,
    lineHeight: "1.5em",
    fontWeight: 500,
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
    color: theme.palette.grey[1000],
    padding: 12,
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
});

type EARecentDiscussionItemDocument = {
  post: PostsRecentDiscussion,
  tag?: never,
} | {
  post?: never,
  tag: TagPreviewFragment,
};

export type EARecentDiscussionItemProps = EARecentDiscussionItemDocument & {
  icon: ForumIconName,
  iconVariant: "primary" | "grey" | "green",
  user?: UsersMinimumInfo | null,
  action: ReactNode,
  postTitleOverride?: string,
  postUrlOverride?: string,
  timestamp: Date,
  anonymous?: boolean,
  pageSubSectionContext?: string,
}

const EARecentDiscussionItem = ({
  icon,
  iconVariant,
  user,
  action,
  postTitleOverride,
  postUrlOverride,
  post,
  tag,
  timestamp,
  anonymous,
  pageSubSectionContext = "recentDiscussionThread",
  children,
  classes,
}: EARecentDiscussionItemProps & {
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageSubSectionContext={pageSubSectionContext}>
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
            {anonymous
              ? "Somebody"
              : <UsersNameDisplay user={user} className={classes.primaryText} />
            }
            {" "}
            {action}
            {" "}
            {post &&
              <Link
                to={postUrlOverride ?? postGetPageUrl(post)}
                className={classes.primaryText}
                eventProps={postUrlOverride ? undefined : {intent: 'expandPost'}}
              >
                {postTitleOverride ?? post.title}
              </Link>
            }
            {tag &&
              <TagsTooltip tag={tag} As="span">
                <Link to={tagGetUrl(tag)} className={classes.primaryText}>
                  {tag.name}
                </Link>
              </TagsTooltip>
            }
            {" "}
            <FormatDate date={timestamp} includeAgo />
          </div>
        </div>
        {children &&
          <div className={classes.container}>
            <div className={classNames(classes.iconContainer, classes.hideOnMobile)} />
            <div className={classes.content}>
              {children}
            </div>
          </div>
        }
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "EARecentDiscussionItem",
  EARecentDiscussionItem,
  {styles},
);


