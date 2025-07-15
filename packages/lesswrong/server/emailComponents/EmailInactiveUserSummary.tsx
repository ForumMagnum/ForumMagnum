import React from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { truncate } from "@/lib/editor/ellipsize";
import { EmailUsername } from "./EmailUsername";

export type BestReaction = {name: string, count: number};

const styles = defineStyles("EmailInactiveUserSummary", (theme: ThemeType) => ({
  root: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 12,
    fontWeight: 400,
    width: 522,
    maxWidth: "100%",
    margin: "24px auto",
  },
  spacing: {
    marginBottom: 48,
  },
  heading: {
    fontSize: 16,
    fontWeight: 700,
  },
  mostCommentedPost: {
    textDecoration: "underline",
    color: "inherit",
  },
  notifications: {
    fontSize: 11,
  },
  notificationsLink: {
    fontStyle: "italic",
    textDecoration: "underline",
    color: "inherit",
  },
  post: {
    marginBottom: 40,
  },
  postTitle: {
    fontSize: 30,
    fontWeight: 700,
    marginBottom: 0,
    color: "inherit",
  },
  postAuthors: {
    marginBottom: 16,
  },
  postBody: {
    fontFamily: theme.palette.fonts.serifStack,
    fontSize: 12,
    fontWeight: 400,
  },
  hr: {
    border: "none",
    borderBottom: `1px solid ${theme.palette.text.alwaysBlack}`,
  },
}));

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
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      <p>
        Hi <EmailUsername user={user} />,
      </p>
      <p>
        We noticed you haven’t been on the EA Forum in a while. Here are some
        things you’ve missed.
      </p>
      <div className={classes.spacing} />
      <h2 className={classes.heading}>
        Your notifications
      </h2>
      {karmaChange > 0 &&
        <p>
          You earned {karmaChange} karma.
        </p>
      }
      {bestReaction && bestReaction.count > 0 &&
        <p>
          You received {bestReaction.count} :{bestReaction.name}:.
        </p>
      }
      {mostCommentedPost && mostCommentedPost.commentCount > 0 &&
        <p>
          You got {mostCommentedPost.commentCount} new{" "}
          {mostCommentedPost.commentCount === 1 ? "reply" : "replies"}{" "}
          on your post{" "}
          <a
            href={postGetPageUrl(mostCommentedPost.post, true)}
            className={classes.mostCommentedPost}
          >
            {mostCommentedPost.post.title}
          </a>.
        </p>
      }
      <p className={classes.notifications}>
        {unreadNotifications > 0
          ? (
            <>
              You have {unreadNotifications} unread notifications -{" "}
              <a href={getSiteUrl()} className={classes.notificationsLink}>
                View on the EA Forum
              </a>
            </>
          )
          : (
            <a href={getSiteUrl()} className={classes.notificationsLink}>
              See all your notifications on the EA Forum
            </a>
          )
        }
      </p>
      <div className={classes.spacing} />
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
            by {post.user?.displayName}
          </p>
          {post.contents?.htmlHighlight &&
            <div
              dangerouslySetInnerHTML={{
                __html: truncate(
                  post.contents?.htmlHighlight,
                  80,
                  "words",
                  "...",
                  false,
                ),
              }}
              className={classes.postBody}
            />
          }
        </div>
      ))}
      <hr className={classes.hr} />
    </div>
  );
};
