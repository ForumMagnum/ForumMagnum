import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePostsItem, PostsItemConfig } from './usePostsItem';
import { Link } from '../../lib/reactRouterWrapper';
import withErrorBoundary from '../common/withErrorBoundary';
import { useVote } from '../votes/withVote';

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: 6, // TODO Use theme.borderRadius.default once it's merged
    padding: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.grey[600],
    cursor: "pointer",
  },
  details: {
    flexGrow: 1,
  },
  titleOverflow: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 450,
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginBottom: 3,
    maxWidth: 540,
  },
  readTime: {
    textAlign: "right",
  },
  comments: {
    width: 55,
    display: "flex",
    alignItems: "center",
    marginLeft: 10,
    "& svg": {
      height: 18,
    },
  },
  smHide: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
});

export type FriendlyPostsListProps = PostsItemConfig & {
  classes: ClassesType,
};

const FriendlyPostsItem = ({classes, ...props}: FriendlyPostsListProps) => {
  const {
    post,
    postLink,
    userLink,
    commentCount,
    sticky,
    showDraftTag,
    showPersonalIcon,
    curatedIconLeft,
    strikethroughTitle,
    isRead,
    showReadCheckbox,
    analyticsProps,
  } = usePostsItem(props);
  const voteProps = useVote(post, "Posts");

  const { PostsTitle, PostsItemDate, ForumIcon, BookmarkButton } = Components;

  return (
    <AnalyticsContext {...analyticsProps}>
      <Link to={postLink}>
        <div className={classes.root}>
          <div className={classes.karma}>
          </div>
          <div className={classes.details}>
            <div className={classes.titleOverflow}>
              <PostsTitle
                {...{
                  post,
                    postLink,
                    sticky,
                    showDraftTag,
                    showPersonalIcon,
                    curatedIconLeft,
                    strikethroughTitle,
                }}
                read={isRead && !showReadCheckbox}
                className={classes.title}
              />
            </div>
            <div className={classes.meta}>
              <Link to={userLink}>{post.user?.displayName}</Link>
              , <PostsItemDate post={post} noStyles />{" "}
              <span className={classes.smHide}>ago</span>
            </div>
          </div>
          <div className={classes.audio}>
          </div>
          <div className={classes.tag}>
          </div>
          <div className={classes.readTime}>
            {post.readTimeMinutes || 1}m read
          </div>
          <div className={classes.comments}>
            <ForumIcon icon="Comment" />
            {commentCount}
          </div>
          <div className={classes.bookmark}>
            <BookmarkButton post={post} />
          </div>
        </div>
      </Link>
    </AnalyticsContext>
  );
}

const FriendlyPostsItemComponent = registerComponent(
  'FriendlyPostsItem',
  FriendlyPostsItem,
  {
    styles,
    stylePriority: 1,
    hocs: [withErrorBoundary],
    areEqual: {
      terms: "deep",
    },
  },
);

declare global {
  interface ComponentTypes {
    FriendlyPostsItem: typeof FriendlyPostsItemComponent
  }
}
