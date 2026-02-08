"use client";

import React from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import moment from "moment";
import classNames from "classnames";

const UserTopPostsQuery = gql(`
  query UserTopPostsForManager($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsList
      }
    }
  }
`);

const styles = defineStyles("TopPostsManager", (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit * 3,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.unit * 2,
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    color: theme.palette.grey[800],
  },
  restoreButton: {
    padding: "6px 16px",
    position: "relative",
    top: 5,
    fontSize: "0.8125rem",
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    letterSpacing: "0.02857em",
    textTransform: "uppercase",
    color: theme.palette.grey[600],
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    background: "white",
    cursor: "not-allowed",
    opacity: 0.5,
    "&:enabled": {
      cursor: "pointer",
      opacity: 1,
      "&:hover": {
        background: theme.palette.grey[50],
      },
    },
  },
  postList: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.unit,
  },
  postRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.unit * 1.5,
  },
  postItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.unit * 1.5,
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 1.5}px`,
    border: theme.palette.border.grey300,
    borderRadius: 6,
    background: theme.palette.background.pageActiveAreaBackground,
    flex: 1,
  },
  postNumber: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: theme.palette.grey[500],
    minWidth: 16,
    textAlign: "center",
    flexShrink: 0,
  },
  dragHandle: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: 24,
    cursor: "grab",
    padding: "2px 4px",
    borderRadius: 3,
    "& > span": {
      width: 3,
      height: 3,
      borderRadius: "50%",
      background: theme.palette.greyAlpha(0.25),
    },
    "&:hover > span": {
      background: theme.palette.greyAlpha(0.55),
    },
  },
  postContent: {
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
    "&:hover + button": {
      background: theme.palette.grey[100],
      borderColor: theme.palette.grey[400],
      "& svg": {
        opacity: 0.7,
      },
    },
  },
  postTitle: {
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: theme.palette.text.normal,
  },
  postMeta: {
    fontSize: "0.8125rem",
    color: "light-dark(#9a9189, #9a9189)",
    marginTop: 2,
  },
  swapButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    background: "white",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s, border-color 0.15s",
    "&:hover": {
      background: theme.palette.grey[100],
      borderColor: theme.palette.grey[400],
      "& svg": {
        opacity: 0.7,
      },
    },
  },
  swapIcon: {
    width: 16,
    height: 16,
    opacity: 0.35,
    transition: "opacity 0.15s",
  },
}));

const SwapIcon = ({ classes }: { classes: ClassesType<typeof styles> }) => (
  <svg className={classes.swapIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DragHandle = ({ classes }: { classes: ClassesType<typeof styles> }) => (
  <div className={classes.dragHandle}>
    <span />
    <span />
    <span />
    <span />
    <span />
  </div>
);

export const TopPostsManager = ({ userId }: { userId: string }) => {
  const classes = useStyles(styles);

  const { data, loading } = useQuery(UserTopPostsQuery, {
    variables: { 
      selector: userId ? { 
        drafts: { userId, includeArchived: false }
      } : undefined,
      limit: 50,
    },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  if (loading) {
    return null;
  }

  // TODO: Switch to published posts once query is fixed
  const allPosts = data?.posts?.results ?? [];
  const postCount = allPosts.length;

  // Don't show if user has 0-1 posts (nothing to manage)
  if (postCount <= 1) {
    return null;
  }

  const hasCustomization = false;

  // For 2-4 posts, show all posts (no swap buttons)
  // For 5+ posts, show top 4 with swap buttons
  const postsToShow = postCount <= 4 ? allPosts.slice(0, postCount) : allPosts.slice(0, 4);
  const showSwapButtons = postCount >= 5;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.title}>Swap top posts</div>
        <button
          className={classes.restoreButton}
          disabled={!hasCustomization}
          onClick={() => {
            // TODO: Wire up restore defaults functionality
            console.log("Restore defaults clicked");
          }}
        >
          Restore defaults
        </button>
      </div>
      <div className={classes.postList}>
        {postsToShow.map((post, index) => (
          <div key={post._id} className={classes.postRow}>
            <div className={classes.postNumber}>{index + 1}</div>
            <div className={classes.postItem}>
              <DragHandle classes={classes} />
            <div className={classes.postContent}>
              <span className={classes.postTitle}>
                {post.title}
              </span>
              <div className={classes.postMeta}>
                {post.baseScore} · {moment(new Date(post.postedAt)).fromNow()}
              </div>
            </div>
            {showSwapButtons && (
              <button
                className={classes.swapButton}
                onClick={() => {
                  // TODO: Wire up swap functionality
                  console.log(`Swap button clicked for post ${index + 1}`);
                }}
                type="button"
              >
                <SwapIcon classes={classes} />
              </button>
            )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
