import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePostsItem, PostsItemConfig } from './usePostsItem';
import { Link } from '../../lib/reactRouterWrapper';
import { useVote } from '../votes/withVote';
import { max } from "underscore";
import withErrorBoundary from '../common/withErrorBoundary';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const mostRelevantTag = (
  tags: TagPreviewFragment[],
  tagRelevance: Record<string, number>,
): TagPreviewFragment | null => max(tags, ({_id}) => tagRelevance[_id] ?? 0);

const getPrimaryTag = (post: PostsListWithVotes) => {
  const {tags, tagRelevance} = post;
  const core = tags.filter(({core}) => core);
  const result = mostRelevantTag(core?.length ? core : tags, tagRelevance);
  return typeof result === "object" ? result : null;
}

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: SECTION_WIDTH,
    display: "flex",
    alignItems: "center",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: 6, // TODO Use theme.borderRadius.default once it's merged
    padding: `10px 12px 10px 4px`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.grey[600],
    cursor: "pointer",
  },
  karma: {
    width: 40,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  voteButton: {
    fontSize: 25,
    margin: "-12px 0 -8px 0",
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
    whiteSpace: "nowrap",
    width: 75,
    paddingRight: 10,
  },
  comments: {
    width: 50,
    display: "flex",
    alignItems: "center",
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
    commentsLink,
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
  const primaryTag = getPrimaryTag(post);
  console.log("p", primaryTag);

  const {
    PostsTitle, PostsItemDate, ForumIcon, BookmarkButton, OverallVoteButton, FooterTag,
  } = Components;

  return (
    <AnalyticsContext {...analyticsProps}>
      <div className={classes.root}>
        <div className={classes.karma}>
          <div className={classes.voteButton}>
            <OverallVoteButton
              orientation="up"
              color="secondary"
              upOrDown="Upvote"
              solidArrow
              {...voteProps}
            />
          </div>
          {voteProps.baseScore}
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
          {primaryTag && <FooterTag tag={primaryTag} smallText />}
        </div>
        <div className={classes.readTime}>
          {post.readTimeMinutes || 1}m read
        </div>
        <Link to={commentsLink} className={classes.comments}>
          <ForumIcon icon="Comment" />
          {commentCount}
        </Link>
        <div className={classes.bookmark}>
          <BookmarkButton post={post} />
        </div>
      </div>
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
