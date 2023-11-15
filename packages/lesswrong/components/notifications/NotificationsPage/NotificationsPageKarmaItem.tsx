import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import type {
  CommentKarmaChange,
  PostKarmaChange,
  TagRevisionKarmaChange,
} from "../../../lib/types/karmaChangesTypes";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  star: {
    color: theme.palette.icon.yellow,
  },
  amount: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  link: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
});

export const NotificationsPageKarmaItem = ({
  post,
  comment,
  tagRevision,
  classes,
}: {
  post?: PostKarmaChange,
  comment?: CommentKarmaChange,
  tagRevision?: TagRevisionKarmaChange,
  classes: ClassesType<typeof styles>,
}) => {
  let display: {scoreChange: number, description: string, href: string};
  if (post) {
    display = {
      scoreChange: post.scoreChange,
      description: post.title,
      href: postGetPageUrl(post),
    };
  } else if (comment) {
    display = {
      scoreChange: comment.scoreChange,
      description: comment.description ?? "",
      href: commentGetPageUrlFromIds({
        commentId: comment._id,
        postId: comment.postId,
        tagSlug: comment.tagSlug,
        tagCommentType: comment.tagCommentType,
      })
    };
  } else if (tagRevision) {
    display = {
      scoreChange: tagRevision.scoreChange,
      description: tagRevision.tagName ?? "",
      href: tagGetUrl({slug: tagRevision.tagSlug ?? ""}),
    };
  } else {
    return null;
  }

  const {scoreChange, description, href} = display;
  const amountText = scoreChange > 0 ? `+${scoreChange}` : String(scoreChange);
  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      <ForumIcon icon="Star" className={classes.star} />
      <div className={classes.amount}>
        {amountText} karma
      </div>
      <div className={classes.link}>
        <Link to={href}>{description}</Link>
      </div>
    </div>
  );
}

const NotificationsPageKarmaItemComponent = registerComponent(
  "NotificationsPageKarmaItem",
  NotificationsPageKarmaItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageKarmaItem: typeof NotificationsPageKarmaItemComponent
  }
}
