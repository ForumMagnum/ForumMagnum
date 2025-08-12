import React, { Fragment } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { getEAEmojiByName } from "@/lib/voting/eaEmojiPalette";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { EmailUsername } from "./EmailUsername";

export type BestReaction = {name: string, count: number};

const styles = defineStyles("EmailInactiveUserSummary", (theme: ThemeType) => ({
  root: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: "22px",
    width: 522,
    maxWidth: "100%",
    margin: "24px auto",
  },
  spacing: {
    marginBottom: 48,
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
  },
  mostCommentedPost: {
    textDecoration: "underline",
    color: "inherit",
  },
  notifications: {
    fontSize: 12,
    textDecoration: "underline",
  },
  post: {
    marginBottom: 20,
    padding: "12px 24px",
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.default,
  },
  postTitle: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: "36px",
    textDecoration: "none",
    marginBottom: 0,
    color: "inherit",
  },
  postAuthors: {
    marginBottom: 16,
  },
  postAuthor: {
    fontWeight: 500,
    color: theme.palette.text.alwaysBlack,
    textDecoration: "none",
  },
  postBody: {
    fontWeight: 500,
  },
  hr: {
    border: "none",
    borderBottom: `1px solid ${theme.palette.text.alwaysBlack}`,
  },
}));

const truncateDescription = (description: string = "") => {
  const truncated = description.slice(0, 260);
  return truncated.length < description.length ? truncated + "..." : truncated;
}

export const EmailInactiveUserSummary = ({
  user,
  karmaChange,
  bestReaction,
  mostCommentedPost,
  unreadNotifications,
  recommendedPosts,
}: {
  user: DbUser,
  karmaChange: number,
  bestReaction?: BestReaction,
  mostCommentedPost?: {post: DbPost, commentCount: number},
  unreadNotifications: number,
  recommendedPosts: PostsList[],
}) => {
  const bestEmoji = bestReaction ? getEAEmojiByName(bestReaction.name) : null;
  const showKarmaChange = karmaChange > 0;
  const showBestReaction = bestReaction && bestReaction.count > 0 && bestEmoji;
  const showMostCommentedPost = mostCommentedPost && mostCommentedPost.commentCount > 0;
  const showUnreadNotifications = unreadNotifications > 0 && unreadNotifications < 5;

  const showNotificationsSection =
    showKarmaChange ||
    showBestReaction ||
    showMostCommentedPost ||
    showUnreadNotifications;

  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        We noticed you haven’t been on the EA Forum in a while. Here are some
        things you’ve missed.
      </p>
      <div className={classes.spacing} />
      {showNotificationsSection &&
        <>
          <h2 className={classes.heading}>
            Your notifications
          </h2>
          {showKarmaChange &&
            <p>
              You earned {karmaChange} karma 🎉
            </p>
          }
          {showBestReaction &&
            <p>
              You received {bestReaction.count}{" "}
              &quot;{bestEmoji.label.toLowerCase()}&quot;{" "}
              react{bestReaction.count > 1 ? 's' : ''}
            </p>
          }
          {showMostCommentedPost &&
            <p>
              You got {mostCommentedPost.commentCount} new{" "}
              {mostCommentedPost.commentCount === 1 ? "reply" : "replies"}{" "}
              on your post{" "}
              <a
                href={postGetPageUrl(mostCommentedPost.post, true)}
                className={classes.mostCommentedPost}
              >
                {mostCommentedPost.post.title}
              </a>
            </p>
          }
          <p>
            <a href={getSiteUrl()} className={classes.notifications}>
              See all your notifications on the EA Forum
              {showUnreadNotifications && ` (${unreadNotifications} unread)`}
            </a>
          </p>
          <div className={classes.spacing} />
        </>
      }
      {recommendedPosts.length > 0 &&
        <h2 className={classes.heading}>
          Posts you might like
        </h2>
      }
      {recommendedPosts.map((post) => (
        <div className={classes.post} key={post._id}>
          <h3>
            <a href={postGetPageUrl(post, true)} className={classes.postTitle}>
              {post.title}
            </a>
          </h3>
          <p className={classes.postAuthors}>
            by <EmailUsername user={post.user} className={classes.postAuthor} />
            {post.coauthors.map((coauthor) => (
              <Fragment key={coauthor._id}>
                {", "}<EmailUsername user={coauthor} className={classes.postAuthor} />
              </Fragment>
            ))}
          </p>
          {post.contents?.plaintextDescription &&
            <div className={classes.postBody}>
              {truncateDescription(post.contents.plaintextDescription)}
            </div>
          }
        </div>
      ))}
      <hr className={classes.hr} />
    </div>
  );
};
