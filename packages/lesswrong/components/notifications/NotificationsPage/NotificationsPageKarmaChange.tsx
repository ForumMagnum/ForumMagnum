import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { Link } from "../../../lib/reactRouterWrapper";
import type {
  CommentKarmaChange,
  EAReactionChanges,
  PostKarmaChange,
  TagRevisionKarmaChange,
} from "../../../lib/collections/users/karmaChangesGraphQL";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import {
  EmojiOption,
  getEAAnonymousEmojiByName,
  getEAPublicEmojiByName,
} from "../../../lib/voting/eaEmojiPalette";

const styles = (theme: ThemeType) => ({
  amount: {
    marginRight: 5,
  },
  link: {
    color: theme.palette.grey[1000],
    cursor: "pointer",
  },
  tooltip: {
    background: theme.palette.panelBackground.tooltipBackground2,
  },
});

type ReactionUsers = {
  emoji: EmojiOption,
  users: string[],
  userCount?: never,
} | {
  emoji: EmojiOption,
  users?: never,
  userCount: number,
}

type AddedReactions = {
  emoji: EmojiOption,
  users: string,
  tooltip?: string,
}

const formatUsersText = (names: string[], max = 3) => {
  if (names.length < 2) {
    return names[0];
  }
  if (names.length <= max) {
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }
  const shownNames = names.slice(0, max).join(", ");
  const remainder = names.length - max;
  return `${shownNames} and ${remainder} more`;
}

const getAddedReactions = (addedReactions?: EAReactionChanges): AddedReactions[] => {
  if (!addedReactions) {
    return [];
  }
  const emojis: Record<string, ReactionUsers> = {};
  for (const reactionType in addedReactions) {
    const change = addedReactions[reactionType];
    if (typeof change === "number") {
      const emoji = getEAAnonymousEmojiByName(reactionType);
      if (emoji) {
        emojis[reactionType] = {
          emoji,
          userCount: change,
        };
      } else {
        // eslint-disable-next-line no-console
        console.error("Invalid private reactionType:", reactionType);
      }
    } else {
      const emoji = getEAPublicEmojiByName(reactionType);
      if (emoji) {
        emojis[reactionType] = {
          emoji,
          users: change.map(({displayName}) => displayName),
        };
      } else {
        // eslint-disable-next-line no-console
        console.error("Invalid public reactionType:", reactionType);
      }
    }
  }
  return Object.values(emojis).map(({emoji, users = [], userCount}) => {
    return {
      emoji,
      users: users.length
        ? formatUsersText(users)
        : `${userCount} ${userCount === 1 ? "person" : "people"}`,
      tooltip: users.length > 1
        ? `${users.slice(0, -1).join(", ")} and ${users[users.length - 1]}`
        : users[0],
    };
  });
}

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
  let reactions: AddedReactions[] = [];
  let display: ReactNode;

  const {NotificationsPageItem, PostsTooltip, LWTooltip} = Components;
  if (postKarmaChange) {
    karmaChange = postKarmaChange.scoreChange;
    reactions = getAddedReactions(postKarmaChange.eaAddedReacts);
    display = (
      <PostsTooltip postId={postKarmaChange._id}>
        <Link to={postGetPageUrl(postKarmaChange)} className={classes.link}>
          {postKarmaChange.title}
        </Link>
      </PostsTooltip>
    );
  } else if (commentKarmaChange) {
    karmaChange = commentKarmaChange.scoreChange;
    reactions = getAddedReactions(commentKarmaChange.eaAddedReacts);
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

  const amountText = karmaChange < 0 ? String(karmaChange) : `+${karmaChange}`;

  return (
    <>
      {karmaChange !== 0 &&
        <NotificationsPageItem Icon="Star" iconVariant="yellow">
          <div>
            <span className={classes.amount}>{amountText} karma</span> {display}
          </div>
        </NotificationsPageItem>
      }
      {reactions.map(({emoji, users, tooltip}) => (
        <NotificationsPageItem
          key={emoji.name}
          Icon={emoji.Component}
          iconTooltip={emoji.label}
          iconVariant="clear"
        >
          <LWTooltip
            title={tooltip}
            className={classes.link}
            popperClassName={classes.tooltip}
            placement="bottom"
            inlineBlock={false}
          >
            {users}
          </LWTooltip>{" "}
          reacted to {commentKarmaChange && "your"} {display}
        </NotificationsPageItem>
      ))}
    </>
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
