import React, { ReactNode } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import type {
  EAReactionChanges,
} from "../../../server/collections/users/karmaChangesGraphQL";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import {
  EmojiOption,
  getEAAnonymousEmojiByName,
  getEAPublicEmojiByName,
} from "../../../lib/voting/eaEmojiPalette";
import { captureException } from "@sentry/core";
import { userGetProfileUrlFromSlug } from "../../../lib/collections/users/helpers";
import { NotifPopoverLink } from "../useNotificationsPopoverContext";
import type { TagCommentType } from "@/lib/collections/comments/types";
import { NotificationsPageItem } from "./NotificationsPageItem";
import { PostsTooltip } from "../../posts/PostsPreviewTooltip/PostsTooltip";
import { LWTooltip } from "../../common/LWTooltip";

const logAndCaptureError = (error: Error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  captureException(error);
}

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
  users: {displayName: string, slug: string}[],
  userCount?: never,
} | {
  emoji: EmojiOption,
  users?: never,
  userCount: number,
}

type AddedReactions = {
  emoji: EmojiOption,
  users: ReactNode,
  tooltip?: string,
}

const userLink = (user: {displayName: string, slug: string}) => (
  <NotifPopoverLink key={user.slug} to={userGetProfileUrlFromSlug(user.slug)}>{user.displayName}</NotifPopoverLink>
);

const formatUsers = (users: {displayName: string, slug: string}[], max = 3) => {
  const userLinks = users.map(user => userLink(user));

  if (userLinks.length < 2) {
    return userLinks[0];
  }

  // Join all but the last with commas, and add "and" before the last user or "and X more" if over 'max'
  const displayedUserLinks = userLinks.slice(0, Math.min(max, userLinks.length - 1));
  const lastUserOrCount = userLinks.length <= max ? userLinks[userLinks.length - 1] : `${userLinks.length - max} more`;

  return (
    <>
      {displayedUserLinks.reduce((acc, elem) => (acc === null ? [elem] : [...acc, ', ', elem]), null)}
      {' and '}
      {lastUserOrCount}
    </>
  );
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
          users: change.map(({displayName, slug}) => ({ displayName, slug })),
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
      users: users.length ? formatUsers(users) : `${userCount} ${userCount === 1 ? "person" : "people"}`,
      tooltip:
        users.length > 1
          ? `${users
              .slice(0, -1)
              .map(({ displayName }) => displayName)
              .join(", ")} and ${users[users.length - 1].displayName}`
          : users[0]?.displayName,
    };
  });
}

export const NotificationsPageKarmaChangeInner = ({
  postKarmaChange,
  commentKarmaChange,
  tagRevisionKarmaChange,
  classes,
}: {
  postKarmaChange?: PostKarmaChange,
  commentKarmaChange?: CommentKarmaChange,
  tagRevisionKarmaChange?: RevisionsKarmaChange,
  classes: ClassesType<typeof styles>,
}) => {
  let karmaChange: number;
  let reactions: AddedReactions[] = [];
  let display: ReactNode;
  if (postKarmaChange) {
    const postUrl = postGetPageUrl({_id: postKarmaChange.postId, slug: postKarmaChange.slug})
    karmaChange = postKarmaChange.scoreChange;
    reactions = getAddedReactions(postKarmaChange.eaAddedReacts);
    display = (
      <PostsTooltip postId={postKarmaChange.postId}>
        <NotifPopoverLink to={postUrl} className={classes.link}>
          {postKarmaChange.title}
        </NotifPopoverLink>
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
            postId={commentKarmaChange.postId ?? undefined}
            commentId={commentKarmaChange.commentId ?? undefined}
          >
            <NotifPopoverLink
              to={commentGetPageUrlFromIds({ ...commentKarmaChange, tagCommentType: commentKarmaChange.tagCommentType as TagCommentType })}
              className={classes.link}
            >
              comment
            </NotifPopoverLink>
          </PostsTooltip>
          {" "}on{" "}
          <PostsTooltip postId={commentKarmaChange.postId ?? undefined}>
            <NotifPopoverLink
              to={postGetPageUrl({_id: postId, slug: postSlug})}
              className={classes.link}
            >
              {postTitle}
            </NotifPopoverLink>
          </PostsTooltip>
        </>
      );
    } else if (tagSlug) {
      display = (
        <>
          <NotifPopoverLink
            to={commentGetPageUrlFromIds({ ...commentKarmaChange, tagCommentType: commentKarmaChange.tagCommentType as TagCommentType })}
            className={classes.link}
          >
            comment
          </NotifPopoverLink> on{" "}
          <NotifPopoverLink
            to={tagGetUrl({slug: tagSlug})}
            className={classes.link}
          >
            {tagName}
          </NotifPopoverLink>
        </>
      );
    } else {
      logAndCaptureError(new Error(`Invalid commentKarmaChange ${JSON.stringify(commentKarmaChange)}`));
      return null;
    }
  } else if (tagRevisionKarmaChange) {
    if (!tagRevisionKarmaChange.tagName || !tagRevisionKarmaChange.tagSlug) {
      logAndCaptureError(new Error(`Invalid tagRevisionKarmaChange ${JSON.stringify(tagRevisionKarmaChange)}`));
      return null;
    }
    karmaChange = tagRevisionKarmaChange.scoreChange;
    display = (
      <NotifPopoverLink
        to={tagGetUrl({slug: tagRevisionKarmaChange.tagSlug})}
        className={classes.link}
      >
        {tagRevisionKarmaChange.tagName}
      </NotifPopoverLink>
    );
  } else {
    logAndCaptureError(new Error(`Invalid karma change: ${JSON.stringify({postKarmaChange, commentKarmaChange, tagRevisionKarmaChange})}`));
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

export const NotificationsPageKarmaChange = registerComponent(
  "NotificationsPageKarmaChange",
  NotificationsPageKarmaChangeInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageKarmaChange: typeof NotificationsPageKarmaChange
  }
}
