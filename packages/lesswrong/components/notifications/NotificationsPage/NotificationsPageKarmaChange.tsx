import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { Link } from "../../../lib/reactRouterWrapper";
import type {
  CommentKarmaChange,
  PostKarmaChange,
  TagRevisionKarmaChange,
} from "../../../lib/collections/users/karmaChangesGraphQL";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";

const styles = (theme: ThemeType) => ({
  amount: {
    marginRight: 5,
  },
  link: {
    color: theme.palette.grey[1000],
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

export const NotificationsPageKarmaChange = ({
  postKarmaChange,
  commentKarmaChange,
  tagRevisionKarmaChange,
  classes,
}: {
  postKarmaChange?: PostKarmaChange,
  commentKarmaChange?: CommentKarmaChange,
  tagRevisionKarmaChange?: TagRevisionKarmaChange,
  classes: ClassesType<typeof styles>,
}) => {
  let karmaChange: number;
  let display: ReactNode;

  const {NotificationsPageItem, PostsTooltip} = Components;
  if (postKarmaChange) {
    karmaChange = postKarmaChange.scoreChange;
    display = (
      <PostsTooltip postId={postKarmaChange._id}>
        <Link to={postGetPageUrl(postKarmaChange)} className={classes.link}>
          {postKarmaChange.title}
        </Link>
      </PostsTooltip>
    );
  } else if (commentKarmaChange) {
    karmaChange = commentKarmaChange.scoreChange;
    const {postId, postSlug, postTitle, tagSlug, tagName} = commentKarmaChange;
    if (postId && postSlug && postTitle) {
      display = (
        <>
          <PostsTooltip
            postId={commentKarmaChange.postId}
            commentId={commentKarmaChange._id}
          >
            <Link
              to={commentGetPageUrlFromIds({
                ...commentKarmaChange,
                commentId: commentKarmaChange._id,
              })}
              className={classes.link}
            >
              comment
            </Link>
          </PostsTooltip>
          {" "}on{" "}
          <PostsTooltip postId={commentKarmaChange.postId}>
            <Link
              to={postGetPageUrl({_id: postId, slug: postSlug})}
              className={classes.link}
            >
              {postTitle}
            </Link>
          </PostsTooltip>
        </>
      );
    } else if (tagSlug) {
      display = (
        <>
          <Link
            to={commentGetPageUrlFromIds({
              ...commentKarmaChange,
              commentId: commentKarmaChange._id,
            })}
            className={classes.link}
          >
            comment
          </Link> on{" "}
          <Link
            to={tagGetUrl({slug: tagSlug})}
            className={classes.link}
          >
            {tagName}
          </Link>
        </>
      );
    } else {
      return null;
    }
  } else if (tagRevisionKarmaChange) {
    if (!tagRevisionKarmaChange.tagName || !tagRevisionKarmaChange.tagSlug) {
      return null;
    }
    karmaChange = tagRevisionKarmaChange.scoreChange;
    display = (
      <Link
        to={tagGetUrl({slug: tagRevisionKarmaChange.tagSlug})}
        className={classes.link}
      >
        {tagRevisionKarmaChange.tagName}
      </Link>
    );
  } else {
    return null;
  }

  if (!karmaChange) {
    return null;
  }

  const amountText = karmaChange > 0 ? `+${karmaChange}` : String(karmaChange);

  return (
    <NotificationsPageItem Icon="Sparkles" iconVariant="yellow">
      <div>
        <span className={classes.amount}>{amountText} karma</span> {display}
      </div>
    </NotificationsPageItem>
  );
}

const NotificationsPageKarmaChangeComponent = registerComponent(
  "NotificationsPageKarmaChange",
  NotificationsPageKarmaChange,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageKarmaChange: typeof NotificationsPageKarmaChangeComponent
  }
}
